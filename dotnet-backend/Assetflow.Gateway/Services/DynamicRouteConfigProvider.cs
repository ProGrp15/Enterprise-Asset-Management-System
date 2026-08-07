using System.Text.Json;
using Assetflow.Gateway.Models;
using Yarp.ReverseProxy.Configuration;

namespace Assetflow.Gateway.Services
{
    /// <summary>
    /// Background service that polls the Discovery Server to dynamically 
    /// update YARP reverse proxy routes and clusters.
    /// </summary>
    public class DynamicRouteConfigProvider : BackgroundService
    {
        private readonly InMemoryConfigProvider _proxyConfigProvider;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DynamicRouteConfigProvider> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(10);

        // Static route definitions: path prefix -> service name
        private static readonly Dictionary<string, string> RouteMap = new(StringComparer.OrdinalIgnoreCase)
        {
            { "/api/auth",           "assetflow-companyservice" },
            { "/api/companies",      "assetflow-companyservice" },
            { "/api/departments",    "assetflow-companyservice" },
            { "/api/employees",      "assetflow-companyservice" },
            { "/api/vendors",        "assetflow-companyservice" },
            { "/api/assets",         "assetflow-assetservice" },
            { "/api/categories",     "assetflow-assetservice" },
            { "/api/allocations",    "assetflow-assetservice" },
            { "/api/maintenance",    "assetflow-assetservice" },
            { "/api/audit-logs",     "assetflow-assetservice" },
            { "/api/purchase-orders","assetflow-assetservice" },
            { "/api/notifications",  "assetflow-assetservice" },
        };

        public DynamicRouteConfigProvider(
            InMemoryConfigProvider proxyConfigProvider,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<DynamicRouteConfigProvider> logger)
        {
            _proxyConfigProvider = proxyConfigProvider;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dynamic Route Config Provider started. Polling discovery server every {Interval}s", _pollInterval.TotalSeconds);

            // Initial load with fallback config
            UpdateWithFallbackConfig();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RefreshRoutesFromDiscovery(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to refresh routes from discovery server, using last known or fallback config");
                }

                await Task.Delay(_pollInterval, stoppingToken);
            }
        }

        private async Task RefreshRoutesFromDiscovery(CancellationToken ct)
        {
            var discoveryUrl = _configuration.GetValue<string>("Gateway:DiscoveryServerUrl") ?? "http://localhost:5001";
            var client = _httpClientFactory.CreateClient("DiscoveryClient");
            client.Timeout = TimeSpan.FromSeconds(5);

            var response = await client.GetAsync($"{discoveryUrl}/api/discovery/services", ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Discovery server returned {StatusCode}", response.StatusCode);
                return;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var discoveryResponse = JsonSerializer.Deserialize<DiscoveryServiceResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (discoveryResponse?.Services == null || discoveryResponse.Services.Count == 0)
            {
                _logger.LogDebug("No services registered in discovery server");
                return;
            }

            var routes = new List<RouteConfig>();
            var clusters = new Dictionary<string, ClusterConfig>();

            foreach (var (pathPrefix, serviceName) in RouteMap)
            {
                var clusterId = serviceName;

                // Build cluster from discovery data
                if (discoveryResponse.Services.TryGetValue(serviceName, out var instances) && instances.Count > 0)
                {
                    var destinations = new Dictionary<string, DestinationConfig>();
                    foreach (var inst in instances.Where(i => i.Status == "UP"))
                    {
                        destinations[inst.InstanceId] = new DestinationConfig
                        {
                            Address = inst.ServiceUrl.TrimEnd('/')
                        };
                    }

                    if (destinations.Count > 0)
                    {
                        clusters[clusterId] = new ClusterConfig
                        {
                            ClusterId = clusterId,
                            Destinations = destinations,
                            LoadBalancingPolicy = "RoundRobin"
                        };
                    }
                }

                // Only create routes for clusters that actually exist
                if (clusters.ContainsKey(clusterId))
                {
                    var routeId = $"route-{pathPrefix.Replace("/", "-").TrimStart('-')}";
                    routes.Add(new RouteConfig
                    {
                        RouteId = routeId,
                        ClusterId = clusterId,
                        Match = new RouteMatch
                        {
                            Path = $"{pathPrefix}/{{**catch-all}}"
                        }
                    });
                }
            }

            if (routes.Count > 0)
            {
                _proxyConfigProvider.Update(routes, clusters.Values.ToList());
                _logger.LogInformation("Updated YARP proxy config: {RouteCount} routes, {ClusterCount} clusters", routes.Count, clusters.Count);
            }
        }

        private void UpdateWithFallbackConfig()
        {
            var fallbackRoutes = new List<RouteConfig>();
            var fallbackClusters = new List<ClusterConfig>();

            // Fallback: AssetService on port 5002
            var assetServiceUrl = _configuration.GetValue<string>("Gateway:Fallback:AssetServiceUrl") ?? "http://localhost:5002";
            fallbackClusters.Add(new ClusterConfig
            {
                ClusterId = "assetflow-assetservice",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["fallback-asset"] = new DestinationConfig { Address = assetServiceUrl }
                }
            });

            // Fallback: CompanyService on port 5003
            var companyServiceUrl = _configuration.GetValue<string>("Gateway:Fallback:CompanyServiceUrl") ?? "http://localhost:5003";
            fallbackClusters.Add(new ClusterConfig
            {
                ClusterId = "assetflow-companyservice",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["fallback-company"] = new DestinationConfig { Address = companyServiceUrl }
                }
            });

            foreach (var (pathPrefix, serviceName) in RouteMap)
            {
                var routeId = $"route-{pathPrefix.Replace("/", "-").TrimStart('-')}";
                fallbackRoutes.Add(new RouteConfig
                {
                    RouteId = routeId,
                    ClusterId = serviceName,
                    Match = new RouteMatch
                    {
                        Path = $"{pathPrefix}/{{**catch-all}}"
                    }
                });
            }

            _proxyConfigProvider.Update(fallbackRoutes, fallbackClusters);
            _logger.LogInformation("Loaded fallback proxy config: {RouteCount} routes, {ClusterCount} clusters", fallbackRoutes.Count, fallbackClusters.Count);
        }
    }
}

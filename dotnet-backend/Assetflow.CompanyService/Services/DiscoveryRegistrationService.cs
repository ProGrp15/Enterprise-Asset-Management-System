using System.Net.Http.Json;

namespace Assetflow.Common.Services
{
    /// <summary>
    /// Hosted service that registers the current microservice with the 
    /// AssetFlow Discovery Server on startup and sends periodic heartbeats.
    /// Add this to any microservice that needs to be discovered by the gateway.
    /// </summary>
    public class DiscoveryRegistrationService : BackgroundService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DiscoveryRegistrationService> _logger;
        private readonly TimeSpan _heartbeatInterval = TimeSpan.FromSeconds(15);
        private string _instanceId = string.Empty;
        private string _serviceName = string.Empty;

        public DiscoveryRegistrationService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<DiscoveryRegistrationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _serviceName = _configuration.GetValue<string>("Discovery:ServiceName") ?? "unknown-service";
            var discoveryUrl = _configuration.GetValue<string>("Discovery:ServerUrl") ?? "http://localhost:5001";
            var serviceHost = _configuration.GetValue<string>("Discovery:Host") ?? "localhost";
            var servicePort = _configuration.GetValue<int>("Discovery:Port");

            if (servicePort == 0)
            {
                _logger.LogWarning("Discovery:Port is not set. Skipping service registration.");
                return;
            }

            _instanceId = $"{_serviceName}:{serviceHost}:{servicePort}";
            _logger.LogInformation("Starting discovery registration for '{ServiceName}' at {DiscoveryUrl}", _serviceName, discoveryUrl);

            // Wait a short time for the app to be ready
            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

            // Register with discovery server
            var registered = false;
            while (!registered && !stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient("DiscoveryClient");
                    client.Timeout = TimeSpan.FromSeconds(5);

                    var response = await client.PostAsJsonAsync($"{discoveryUrl}/api/discovery/register", new
                    {
                        serviceName = _serviceName,
                        instanceId = _instanceId,
                        host = serviceHost,
                        port = servicePort,
                        serviceUrl = $"http://{serviceHost}:{servicePort}",
                        healthUrl = $"http://{serviceHost}:{servicePort}/health"
                    }, stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Successfully registered '{ServiceName}' [{InstanceId}] with Discovery Server", _serviceName, _instanceId);
                        registered = true;
                    }
                    else
                    {
                        _logger.LogWarning("Registration failed with status {StatusCode}. Retrying in 10s...", response.StatusCode);
                        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not connect to Discovery Server at {DiscoveryUrl}. Retrying in 10s...", discoveryUrl);
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
            }

            // Periodic heartbeats
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient("DiscoveryClient");
                    client.Timeout = TimeSpan.FromSeconds(5);

                    var response = await client.PostAsJsonAsync($"{discoveryUrl}/api/discovery/heartbeat", new
                    {
                        serviceName = _serviceName,
                        instanceId = _instanceId
                    }, stoppingToken);

                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Heartbeat failed ({StatusCode}), attempting re-registration...", response.StatusCode);
                        registered = false;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Heartbeat failed for '{ServiceName}'", _serviceName);
                }

                await Task.Delay(_heartbeatInterval, stoppingToken);
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            // Deregister on shutdown
            try
            {
                var discoveryUrl = _configuration.GetValue<string>("Discovery:ServerUrl") ?? "http://localhost:5001";
                var client = _httpClientFactory.CreateClient("DiscoveryClient");
                client.Timeout = TimeSpan.FromSeconds(3);

                await client.DeleteAsync($"{discoveryUrl}/api/discovery/deregister/{_serviceName}/{_instanceId}", cancellationToken);
                _logger.LogInformation("Deregistered '{ServiceName}' [{InstanceId}] from Discovery Server", _serviceName, _instanceId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deregister from Discovery Server on shutdown");
            }

            await base.StopAsync(cancellationToken);
        }
    }
}

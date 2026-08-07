using System.Collections.Concurrent;
using Assetflow.DiscoveryServer.Models;

namespace Assetflow.DiscoveryServer.Services
{
    public class ServiceRegistry : IServiceRegistry
    {
        // Key: serviceName (lowercase) -> Value: ConcurrentDictionary<instanceId, ServiceInstance>
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ServiceInstance>> _registry = new(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger<ServiceRegistry> _logger;

        public ServiceRegistry(ILogger<ServiceRegistry> logger)
        {
            _logger = logger;
        }

        public ServiceInstance Register(RegisterServiceRequest request)
        {
            var serviceName = request.ServiceName.Trim().ToLowerInvariant();
            var instanceId = string.IsNullOrWhiteSpace(request.InstanceId) 
                ? $"{serviceName}:{request.Host}:{request.Port}"
                : request.InstanceId;

            var serviceUrl = !string.IsNullOrWhiteSpace(request.ServiceUrl) 
                ? request.ServiceUrl 
                : $"http://{request.Host}:{request.Port}";

            var healthUrl = !string.IsNullOrWhiteSpace(request.HealthUrl)
                ? request.HealthUrl
                : $"{serviceUrl.TrimEnd('/')}/health";

            var instance = new ServiceInstance
            {
                InstanceId = instanceId,
                ServiceName = serviceName,
                Host = request.Host,
                Port = request.Port,
                ServiceUrl = serviceUrl,
                HealthUrl = healthUrl,
                Status = "UP",
                RegisteredAt = DateTime.UtcNow,
                LastHeartbeat = DateTime.UtcNow,
                Metadata = request.Metadata ?? new Dictionary<string, string>()
            };

            var serviceInstances = _registry.GetOrAdd(serviceName, _ => new ConcurrentDictionary<string, ServiceInstance>());
            serviceInstances[instanceId] = instance;

            _logger.LogInformation("Registered service '{ServiceName}' instance '{InstanceId}' at {ServiceUrl}", serviceName, instanceId, serviceUrl);
            return instance;
        }

        public bool Heartbeat(string serviceName, string instanceId)
        {
            var key = serviceName.Trim().ToLowerInvariant();
            if (_registry.TryGetValue(key, out var instances) && instances.TryGetValue(instanceId, out var instance))
            {
                instance.LastHeartbeat = DateTime.UtcNow;
                instance.Status = "UP";
                _logger.LogDebug("Heartbeat received for '{ServiceName}' [{InstanceId}]", serviceName, instanceId);
                return true;
            }
            return false;
        }

        public bool Deregister(string serviceName, string instanceId)
        {
            var key = serviceName.Trim().ToLowerInvariant();
            if (_registry.TryGetValue(key, out var instances))
            {
                var removed = instances.TryRemove(instanceId, out _);
                if (removed)
                {
                    _logger.LogInformation("Deregistered service '{ServiceName}' instance '{InstanceId}'", serviceName, instanceId);
                }
                return removed;
            }
            return false;
        }

        public IEnumerable<ServiceInstance> GetAllInstances()
        {
            return _registry.Values.SelectMany(dict => dict.Values);
        }

        public IEnumerable<ServiceInstance> GetInstancesForService(string serviceName)
        {
            var key = serviceName.Trim().ToLowerInvariant();
            if (_registry.TryGetValue(key, out var instances))
            {
                return instances.Values.Where(i => i.Status == "UP");
            }
            return Enumerable.Empty<ServiceInstance>();
        }

        public IDictionary<string, List<ServiceInstance>> GetServicesGrouped()
        {
            var result = new Dictionary<string, List<ServiceInstance>>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in _registry)
            {
                result[kvp.Key] = kvp.Value.Values.ToList();
            }
            return result;
        }

        public void CleanupStaleInstances(TimeSpan timeout)
        {
            var cutoff = DateTime.UtcNow - timeout;
            foreach (var serviceKvp in _registry)
            {
                foreach (var instanceKvp in serviceKvp.Value)
                {
                    if (instanceKvp.Value.LastHeartbeat < cutoff)
                    {
                        instanceKvp.Value.Status = "DOWN";
                        _logger.LogWarning("Marked service '{ServiceName}' instance '{InstanceId}' as DOWN (No heartbeat since {LastHeartbeat})", 
                            serviceKvp.Key, instanceKvp.Key, instanceKvp.Value.LastHeartbeat);
                    }
                }
            }
        }
    }
}

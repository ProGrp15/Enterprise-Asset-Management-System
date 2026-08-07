using Assetflow.DiscoveryServer.Models;

namespace Assetflow.DiscoveryServer.Services
{
    public interface IServiceRegistry
    {
        ServiceInstance Register(RegisterServiceRequest request);
        bool Heartbeat(string serviceName, string instanceId);
        bool Deregister(string serviceName, string instanceId);
        IEnumerable<ServiceInstance> GetAllInstances();
        IEnumerable<ServiceInstance> GetInstancesForService(string serviceName);
        IDictionary<string, List<ServiceInstance>> GetServicesGrouped();
        void CleanupStaleInstances(TimeSpan timeout);
    }
}

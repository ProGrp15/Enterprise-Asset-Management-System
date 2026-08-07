namespace Assetflow.Gateway.Models
{
    public class DiscoveryServiceResponse
    {
        public DateTime Timestamp { get; set; }
        public int TotalServices { get; set; }
        public int TotalInstances { get; set; }
        public Dictionary<string, List<DiscoveredInstance>> Services { get; set; } = new();
    }

    public class DiscoveredInstance
    {
        public string InstanceId { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string Host { get; set; } = "localhost";
        public int Port { get; set; }
        public string ServiceUrl { get; set; } = string.Empty;
        public string? HealthUrl { get; set; }
        public string Status { get; set; } = "UP";
        public DateTime LastHeartbeat { get; set; }
    }

    public class GatewayRouteConfig
    {
        public string RouteId { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string PathPrefix { get; set; } = string.Empty;
    }
}

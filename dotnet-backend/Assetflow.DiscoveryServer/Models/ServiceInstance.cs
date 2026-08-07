namespace Assetflow.DiscoveryServer.Models
{
    public class ServiceInstance
    {
        public string InstanceId { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string Host { get; set; } = "localhost";
        public int Port { get; set; }
        public string ServiceUrl { get; set; } = string.Empty;
        public string? HealthUrl { get; set; }
        public string Status { get; set; } = "UP"; // UP, DOWN, UNHEALTHY
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class RegisterServiceRequest
    {
        public string ServiceName { get; set; } = string.Empty;
        public string? InstanceId { get; set; }
        public string Host { get; set; } = "localhost";
        public int Port { get; set; }
        public string? ServiceUrl { get; set; }
        public string? HealthUrl { get; set; }
        public Dictionary<string, string>? Metadata { get; set; }
    }

    public class HeartbeatRequest
    {
        public string ServiceName { get; set; } = string.Empty;
        public string InstanceId { get; set; } = string.Empty;
    }
}

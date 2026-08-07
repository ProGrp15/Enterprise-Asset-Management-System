namespace Assetflow.DiscoveryServer.Services
{
    public class HealthCheckBackgroundService : BackgroundService
    {
        private readonly IServiceRegistry _registry;
        private readonly ILogger<HealthCheckBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(10);
        private readonly TimeSpan _heartbeatTimeout = TimeSpan.FromSeconds(30);

        public HealthCheckBackgroundService(IServiceRegistry registry, ILogger<HealthCheckBackgroundService> logger)
        {
            _registry = registry;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Discovery Server Health Check Background Service starting...");
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _registry.CleanupStaleInstances(_heartbeatTimeout);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while checking stale discovery instances");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }
    }
}

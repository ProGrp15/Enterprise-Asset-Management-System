using System.Text;
using System.Xml.Linq;
using Assetflow.DiscoveryServer.Models;
using Assetflow.DiscoveryServer.Services;
using Microsoft.AspNetCore.Mvc;

namespace Assetflow.DiscoveryServer.Controllers
{
    [ApiController]
    [Route("api/discovery")]
    public class DiscoveryController : ControllerBase
    {
        private readonly IServiceRegistry _registry;

        public DiscoveryController(IServiceRegistry registry)
        {
            _registry = registry;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterServiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName))
            {
                return BadRequest(new { message = "ServiceName is required." });
            }

            var instance = _registry.Register(request);
            return Ok(new { message = "Service registered successfully", instance });
        }

        [HttpPost("heartbeat")]
        public IActionResult Heartbeat([FromBody] HeartbeatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName) || string.IsNullOrWhiteSpace(request.InstanceId))
            {
                return BadRequest(new { message = "ServiceName and InstanceId are required." });
            }

            var updated = _registry.Heartbeat(request.ServiceName, request.InstanceId);
            if (!updated)
            {
                return NotFound(new { message = "Instance not found. Re-registration required." });
            }

            return Ok(new { status = "UP", timestamp = DateTime.UtcNow });
        }

        [HttpPut("renew/{serviceName}/{instanceId}")]
        public IActionResult Renew(string serviceName, string instanceId)
        {
            var updated = _registry.Heartbeat(serviceName, instanceId);
            if (!updated)
            {
                return NotFound(new { message = "Instance not found" });
            }
            return Ok(new { status = "UP" });
        }

        [HttpDelete("deregister/{serviceName}/{instanceId}")]
        public IActionResult Deregister(string serviceName, string instanceId)
        {
            var removed = _registry.Deregister(serviceName, instanceId);
            if (!removed)
            {
                return NotFound(new { message = "Instance not found" });
            }
            return Ok(new { message = "Deregistered successfully" });
        }

        [HttpGet("services")]
        public IActionResult GetAllServices()
        {
            var grouped = _registry.GetServicesGrouped();
            return Ok(new
            {
                timestamp = DateTime.UtcNow,
                totalServices = grouped.Count,
                totalInstances = grouped.Sum(g => g.Value.Count),
                services = grouped
            });
        }

        [HttpGet("services/{serviceName}")]
        public IActionResult GetServiceInstances(string serviceName)
        {
            var instances = _registry.GetInstancesForService(serviceName);
            return Ok(instances);
        }

        // Eureka REST Compatible API Endpoints
        [HttpGet("/eureka/apps")]
        [Produces("application/json", "application/xml")]
        public IActionResult GetEurekaApps()
        {
            var grouped = _registry.GetServicesGrouped();
            var applications = grouped.Select(g => new
            {
                name = g.Key.ToUpper(),
                instance = g.Value.Select(i => new
                {
                    instanceId = i.InstanceId,
                    hostName = i.Host,
                    app = i.ServiceName.ToUpper(),
                    ipAddr = i.Host,
                    status = i.Status,
                    port = new { Port = i.Port, enabled = "true" },
                    homePageUrl = i.ServiceUrl,
                    statusPageUrl = i.HealthUrl,
                    healthCheckUrl = i.HealthUrl
                })
            });

            return Ok(new { applications = new { application = applications } });
        }
    }
}

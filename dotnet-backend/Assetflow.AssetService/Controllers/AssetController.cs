using System.Security.Claims;
using Assetflow.AssetService.Models;
using Assetflow.AssetService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assetflow.AssetService.Controllers
{
    [ApiController]
    [Authorize]
    public class AssetController : ControllerBase
    {
        private readonly AssetDataService _service;
        private static readonly HashSet<string> ValidTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "asset", "category", "vendor", "purchase-order", "maintenance",
            "asset-allocation", "asset-request", "asset-transfer", "asset-return", "repair-history"
        };

        public AssetController(AssetDataService service)
        {
            _service = service;
        }

        private long CompanyId()
        {
            var claim = User.FindFirst("companyId")?.Value;
            return claim != null ? long.Parse(claim) : 0;
        }

        private long UserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            return claim != null ? long.Parse(claim.Value) : 0;
        }

        private string Role()
        {
            return User.FindFirst("role")?.Value ?? "";
        }

        private void AssertWriteAccess(string type)
        {
            var role = Role();
            if (role is "COMPANY_ADMIN" or "SUPER_ADMIN") return;
            if (role == "EMPLOYEE" && type is "asset-request" or "asset-return" or "maintenance") return;
            throw new UnauthorizedAccessException("You do not have permission to modify this resource");
        }

        [HttpGet("{type}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<IDictionary<string, object>>>>> List(
            string type,
            [FromQuery] string? search,
            [FromQuery] int page = 0,
            [FromQuery] int size = 25)
        {
            if (!ValidTypes.Contains(type)) return NotFound();
            var data = await _service.ListAsync(type, CompanyId(), UserId(), Role(), search, page, size);
            return Ok(ApiResponse<IEnumerable<IDictionary<string, object>>>.Ok(data));
        }

        [HttpGet("{type}/{id}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> One(string type, long id)
        {
            if (!ValidTypes.Contains(type)) return NotFound();
            var data = await _service.OneAsync(type, CompanyId(), UserId(), Role(), id);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPost("{type}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> Create(string type, [FromBody] IDictionary<string, object> body)
        {
            if (!ValidTypes.Contains(type)) return NotFound();
            AssertWriteAccess(type);

            if (Role() == "EMPLOYEE")
            {
                if (type is "asset-request" or "asset-return" or "maintenance")
                {
                    body["employeeId"] = UserId();
                    body["requestedBy"] = UserId();
                    if (type is "asset-return" or "maintenance")
                    {
                        body.TryGetValue("assetId", out var assetId);
                        await _service.EnsureEmployeeAssetAsync(CompanyId(), UserId(), assetId);
                    }
                }
            }

            if (type == "asset-allocation")
            {
                if (!body.ContainsKey("allocatedBy")) body["allocatedBy"] = UserId();
            }
            if (type is "asset-transfer" or "asset-return")
            {
                if (!body.ContainsKey("requestedBy")) body["requestedBy"] = UserId();
            }

            var data = await _service.CreateAsync(type, CompanyId(), UserId(), body);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPost("asset/import")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> ImportAssets([FromBody] IEnumerable<IDictionary<string, object>> rows)
        {
            AssertWriteAccess("asset");
            var data = await _service.ImportAssetsAsync(CompanyId(), UserId(), rows);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPut("{type}/{id}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> Update(string type, long id, [FromBody] IDictionary<string, object> body)
        {
            if (!ValidTypes.Contains(type)) return NotFound();
            AssertWriteAccess(type);

            if (Role() == "EMPLOYEE")
            {
                body["employeeId"] = UserId();
                if (type is "asset-return" or "maintenance")
                {
                    body.TryGetValue("assetId", out var assetId);
                    await _service.EnsureEmployeeAssetAsync(CompanyId(), UserId(), assetId);
                }
            }

            string GetStatus(IDictionary<string, object> dict)
            {
                return dict.TryGetValue("status", out var val) ? val?.ToString() ?? "" : "";
            }

            if (type is "asset-request" or "asset-return" or "asset-transfer")
            {
                if ("APPROVED".Equals(GetStatus(body), StringComparison.OrdinalIgnoreCase))
                {
                    if (!body.ContainsKey("approvedBy")) body["approvedBy"] = UserId();
                }
            }

            var data = await _service.UpdateAsync(type, CompanyId(), UserId(), id, body);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpDelete("{type}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(string type, long id)
        {
            if (!ValidTypes.Contains(type)) return NotFound();
            AssertWriteAccess(type);
            await _service.DeleteAsync(type, CompanyId(), UserId(), id);
            return Ok(ApiResponse<object>.WithMessage("Deleted successfully"));
        }
    }
}

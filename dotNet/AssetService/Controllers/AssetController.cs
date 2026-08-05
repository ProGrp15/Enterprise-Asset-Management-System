using System.Text.Json;
using AssetService.DTOs;
using AssetService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssetService.Controllers
{
    [ApiController]
    [Authorize]
    public class AssetController : ControllerBase
    {
        private readonly IAssetDataService _service;

        public AssetController(IAssetDataService service)
        {
            _service = service;
        }

        private long GetCompanyId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "companyId");
            return claim != null && long.TryParse(claim.Value, out long id) ? id : throw new UnauthorizedAccessException("Missing companyId claim");
        }

        private long GetUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" || c.Type == "sub");
            return claim != null && long.TryParse(claim.Value, out long id) ? id : throw new UnauthorizedAccessException("Missing user claim");
        }

        private string GetRole()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "role" || c.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
            return claim?.Value ?? string.Empty;
        }

        private void AssertWriteAccess(string type)
        {
            var role = GetRole();
            if (role == "COMPANY_ADMIN" || role == "SUPER_ADMIN") return;
            if (role == "EMPLOYEE" && (type == "asset-request" || type == "asset-return" || type == "maintenance")) return;
            throw new UnauthorizedAccessException("You do not have permission to modify this resource");
        }

        [HttpGet("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history))}")]
        public async Task<ActionResult<ApiResponse<object>>> List([FromRoute] string type, [FromQuery] string? search, [FromQuery] int page = 0, [FromQuery] int size = 25)
        {
            try
            {
                var result = await _service.ListAsync(type, GetCompanyId(), GetUserId(), GetRole(), search, page, size);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpGet("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> One([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                var result = await _service.OneAsync(type, GetCompanyId(), GetUserId(), GetRole(), id);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(ApiResponse<object>.Error("Resource not found"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPost("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history))}")]
        public async Task<ActionResult<ApiResponse<object>>> Create([FromRoute] string type, [FromBody] Dictionary<string, object> bodyDict)
        {
            try
            {
                AssertWriteAccess(type);
                var role = GetRole();
                var userId = GetUserId();
                var companyId = GetCompanyId();

                if (role == "EMPLOYEE")
                {
                    if (type == "asset-request" || type == "asset-return" || type == "maintenance")
                    {
                        bodyDict["employeeId"] = userId;
                        bodyDict["requestedBy"] = userId;
                        if (type == "asset-return" || type == "maintenance")
                        {
                            long assetId = 0;
                            if (bodyDict.TryGetValue("assetId", out var aIdObj) && aIdObj != null)
                            {
                                long.TryParse(aIdObj.ToString(), out assetId);
                            }
                            await _service.EnsureEmployeeAssetAsync(companyId, userId, assetId);
                        }
                    }
                }

                if (type == "asset-allocation" && !bodyDict.ContainsKey("allocatedBy"))
                {
                    bodyDict["allocatedBy"] = userId;
                }
                if ((type == "asset-transfer" || type == "asset-return") && !bodyDict.ContainsKey("requestedBy"))
                {
                    bodyDict["requestedBy"] = userId;
                }

                var body = JsonSerializer.SerializeToElement(bodyDict);
                var result = await _service.CreateAsync(type, companyId, userId, body);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPost("asset/import")]
        public async Task<ActionResult<ApiResponse<object>>> ImportAssets([FromBody] List<JsonElement> rows)
        {
            try
            {
                AssertWriteAccess("asset");
                var result = await _service.ImportAssetsAsync(GetCompanyId(), GetUserId(), rows);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPut("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Update([FromRoute] string type, [FromRoute] long id, [FromBody] Dictionary<string, object> bodyDict)
        {
            try
            {
                AssertWriteAccess(type);
                var role = GetRole();
                var userId = GetUserId();
                var companyId = GetCompanyId();

                if (role == "EMPLOYEE")
                {
                    bodyDict["employeeId"] = userId;
                    if (type == "asset-return" || type == "maintenance")
                    {
                        long assetId = 0;
                        if (bodyDict.TryGetValue("assetId", out var aIdObj) && aIdObj != null)
                        {
                            long.TryParse(aIdObj.ToString(), out assetId);
                        }
                        await _service.EnsureEmployeeAssetAsync(companyId, userId, assetId);
                    }
                }

                var status = bodyDict.TryGetValue("status", out var s) ? s?.ToString() : null;
                if ((type == "asset-request" || type == "asset-return" || type == "asset-transfer") && "APPROVED".Equals(status, StringComparison.OrdinalIgnoreCase))
                {
                    if (!bodyDict.ContainsKey("approvedBy"))
                    {
                        bodyDict["approvedBy"] = userId;
                    }
                }

                var body = JsonSerializer.SerializeToElement(bodyDict);
                var result = await _service.UpdateAsync(type, companyId, userId, id, body);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(ApiResponse<object>.Error("Resource not found"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpDelete("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                AssertWriteAccess(type);
                await _service.DeleteAsync(type, GetCompanyId(), GetUserId(), id);
                return Ok(ApiResponse<object>.Message("Deleted successfully"));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(ApiResponse<object>.Error("Resource not found"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }
    }
}

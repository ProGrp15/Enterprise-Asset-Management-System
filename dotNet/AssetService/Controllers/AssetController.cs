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
            var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "companyId");
            if (companyIdClaim != null && long.TryParse(companyIdClaim.Value, out long companyId))
            {
                return companyId;
            }
            throw new UnauthorizedAccessException("Missing companyId claim");
        }

        [HttpGet("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request))}")]
        public async Task<ActionResult<ApiResponse<object>>> List([FromRoute] string type)
        {
            try
            {
                var result = await _service.ListAsync(type, GetCompanyId());
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpGet("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> One([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                var result = await _service.OneAsync(type, GetCompanyId(), id);
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

        [HttpPost("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request))}")]
        public async Task<ActionResult<ApiResponse<object>>> Create([FromRoute] string type, [FromBody] JsonElement body)
        {
            try
            {
                var result = await _service.CreateAsync(type, GetCompanyId(), body);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPut("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Update([FromRoute] string type, [FromRoute] long id, [FromBody] JsonElement body)
        {
            try
            {
                var result = await _service.UpdateAsync(type, GetCompanyId(), id, body);
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

        [HttpDelete("{type:regex((asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                await _service.DeleteAsync(type, GetCompanyId(), id);
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

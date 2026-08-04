using System.Text.Json;
using CompanyService.DTOs;
using CompanyService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyService.Controllers
{
    [ApiController]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyDataService _service;

        public CompanyController(ICompanyDataService service)
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
            // Fallback for missing claim (could also throw UnauthorizedAccessException)
            throw new UnauthorizedAccessException("Missing companyId claim");
        }

        [HttpGet("api/{type:regex(^(department|employee|admin|location)$)}")]
        public async Task<ActionResult<ApiResponse<object>>> List([FromRoute] string type, [FromQuery] string? search)
        {
            try
            {
                var result = await _service.ListAsync(type, GetCompanyId(), search);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpGet("api/{type:regex(^(department|employee|admin|location)$)}/{id}")]
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

        [HttpPost("api/{type:regex(^(department|employee|admin|location)$)}")]
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

        [HttpPut("api/{type:regex(^(department|employee|admin|location)$)}/{id}")]
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

        [HttpDelete("api/{type:regex(^(department|employee|admin|location)$)}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Remove([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                await _service.DeleteAsync(type, GetCompanyId(), id);
                return Ok(ApiResponse<object>.Ok(null!));
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

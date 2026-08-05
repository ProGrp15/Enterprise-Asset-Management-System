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

        private void AssertAdmin()
        {
            var role = GetRole();
            if (role != "SUPER_ADMIN" && role != "COMPANY_ADMIN")
            {
                throw new UnauthorizedAccessException("Administrator access is required");
            }
        }

        [HttpGet("api/{type:regex((department|employee|admin|location))}")]
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

        [HttpGet("api/{type:regex((department|employee|admin|location))}/{id}")]
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

        [HttpPost("api/{type:regex((department|employee|admin|location))}")]
        public async Task<ActionResult<ApiResponse<object>>> Create([FromRoute] string type, [FromBody] JsonElement body)
        {
            try
            {
                AssertAdmin();
                var result = await _service.CreateAsync(type, GetCompanyId(), GetUserId(), body);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPost("api/employee/import")]
        public async Task<ActionResult<ApiResponse<object>>> ImportEmployees([FromBody] List<JsonElement> rows)
        {
            try
            {
                AssertAdmin();
                var result = await _service.ImportEmployeesAsync(GetCompanyId(), GetUserId(), rows);
                return Ok(ApiResponse<object>.Ok(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPut("api/{type:regex((department|employee|admin|location))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Update([FromRoute] string type, [FromRoute] long id, [FromBody] JsonElement body)
        {
            try
            {
                AssertAdmin();
                var result = await _service.UpdateAsync(type, GetCompanyId(), GetUserId(), id, body);
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

        [HttpDelete("api/{type:regex((department|employee|admin|location))}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Remove([FromRoute] string type, [FromRoute] long id)
        {
            try
            {
                AssertAdmin();
                await _service.DeleteAsync(type, GetCompanyId(), GetUserId(), id);
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

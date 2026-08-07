using System.Security.Claims;
using Assetflow.CompanyService.Models;
using Assetflow.CompanyService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assetflow.CompanyService.Controllers
{
    [ApiController]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly CompanyDataService _service;

        public CompanyController(CompanyDataService service)
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

        private void AssertAdmin()
        {
            var role = Role();
            if (role != "SUPER_ADMIN" && role != "COMPANY_ADMIN")
            {
                throw new UnauthorizedAccessException("Administrator access is required");
            }
        }

        private bool IsValidType(string type)
        {
            return type is "department" or "employee" or "admin" or "location";
        }

        [HttpGet("api/{type}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<IDictionary<string, object>>>>> List(
            string type,
            [FromQuery] string? search,
            [FromQuery] int page = 0,
            [FromQuery] int size = 25)
        {
            if (!IsValidType(type)) return NotFound();
            var data = await _service.ListAsync(type, CompanyId(), UserId(), Role(), search, page, size);
            return Ok(ApiResponse<IEnumerable<IDictionary<string, object>>>.Ok(data));
        }

        [HttpGet("api/{type}/{id}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> One(string type, long id)
        {
            if (!IsValidType(type)) return NotFound();
            var data = await _service.OneAsync(type, CompanyId(), UserId(), Role(), id);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPost("api/{type}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> Create(string type, [FromBody] IDictionary<string, object> body)
        {
            if (!IsValidType(type)) return NotFound();
            AssertAdmin();
            var data = await _service.CreateAsync(type, CompanyId(), UserId(), body);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPost("api/employee/import")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> ImportEmployees([FromBody] IEnumerable<IDictionary<string, object>> rows)
        {
            AssertAdmin();
            var data = await _service.ImportEmployeesAsync(CompanyId(), UserId(), rows);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpPut("api/{type}/{id}")]
        public async Task<ActionResult<ApiResponse<IDictionary<string, object>>>> Update(string type, long id, [FromBody] IDictionary<string, object> body)
        {
            if (!IsValidType(type)) return NotFound();
            AssertAdmin();
            var data = await _service.UpdateAsync(type, CompanyId(), UserId(), id, body);
            return Ok(ApiResponse<IDictionary<string, object>>.Ok(data));
        }

        [HttpDelete("api/{type}/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(string type, long id)
        {
            if (!IsValidType(type)) return NotFound();
            AssertAdmin();
            await _service.DeleteAsync(type, CompanyId(), UserId(), id);
            return Ok(ApiResponse<object>.Ok(null!));
        }
    }
}

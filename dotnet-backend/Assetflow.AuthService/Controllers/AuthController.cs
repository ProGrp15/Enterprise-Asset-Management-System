using System;
using System.Threading.Tasks;
using Assetflow.AuthService.DTOs;
using Assetflow.AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assetflow.AuthService.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register-company")]
        public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompany request)
        {
            try
            {
                var result = await _authService.RegisterCompanyAsync(request);
                return Ok(ApiResponse<AuthView>.Ok(result, "Company registered successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(ApiResponse<AuthView>.Ok(result, "Login successful"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Error(ex.Message));
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(ApiResponse<object>.Ok(null, "Signed out successfully."));
        }
    }
}

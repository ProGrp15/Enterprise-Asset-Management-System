using Microsoft.AspNetCore.Mvc;
using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace AuthService.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AuthDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Active);

        if (user == null || !VerifyPassword(request.Password, user.Password))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Generate JWT (simplified)
        var token = "mock-jwt-token"; // Integration point for JwtService

        return Ok(new
        {
            message = "Login successful",
            token,
            user = new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                Role = user.Role?.Name,
                CompanyId = user.CompanyId
            }
        });
    }

    private bool VerifyPassword(string raw, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(raw, hash);
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

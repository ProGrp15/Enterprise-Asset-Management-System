using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Assetflow.AuthService.Data;
using Assetflow.AuthService.DTOs;
using Assetflow.AuthService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Assetflow.AuthService.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthView> RegisterCompanyAsync(RegisterCompany request)
        {
            // 1. Validate if company exists
            var existingCompany = await _context.Companies.FirstOrDefaultAsync(c => c.Email == request.OfficialEmail);
            if (existingCompany != null)
                throw new Exception("Company with this email is already registered.");

            // 2. Create Company
            var company = new Company
            {
                Name = request.CompanyName,
                Email = request.OfficialEmail,
                Phone = request.MobileNumber,
                Industry = request.Industry,
                OrganizationSize = request.CompanySize,
                Address = request.Address,
                City = request.City,
                State = request.State,
                Country = request.Country,
                PostalCode = request.PostalCode
            };
            
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // 3. Ensure 'COMPANY_ADMIN' role exists
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "COMPANY_ADMIN");
            if (role == null)
            {
                role = new Role { Name = "COMPANY_ADMIN", Description = "Company Administrator" };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            // 4. Create Admin User
            var user = new User
            {
                CompanyId = company.Id,
                RoleId = role.Id,
                FirstName = request.AdminName.Split(' ').FirstOrDefault() ?? request.AdminName,
                LastName = request.AdminName.Contains(' ') ? request.AdminName.Substring(request.AdminName.IndexOf(' ') + 1) : "",
                Email = request.OfficialEmail,
                Phone = request.MobileNumber,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password) // Using BCrypt to match Java setup
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // 5. Generate Token
            var token = GenerateJwtToken(user, company, role.Name);

            return new AuthView(
                token,
                "refresh_token_placeholder", // Implement refresh token logic later
                new UserView(user.Id, $"{user.FirstName} {user.LastName}", user.Email, role.Name, ""),
                new CompanyView(company.Id, company.Name, company.Email),
                new List<string> { "COMPANY_ADMIN_ACCESS" }
            );
        }

        public async Task<AuthView> LoginAsync(Login request)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                throw new Exception("Invalid email or password.");

            if (!user.IsActive)
                throw new Exception("Your account is disabled. Please contact your administrator.");

            var token = GenerateJwtToken(user, user.Company, user.Role.Name);

            return new AuthView(
                token,
                "refresh_token_placeholder",
                new UserView(user.Id, $"{user.FirstName} {user.LastName}", user.Email, user.Role.Name, user.Department?.Name ?? ""),
                user.Company != null ? new CompanyView(user.Company.Id, user.Company.Name, user.Company.Email) : null,
                new List<string> { user.Role.Name }
            );
        }

        private string GenerateJwtToken(User user, Company company, string roleName)
        {
            var secret = Environment.GetEnvironmentVariable("APP_JWT_SECRET") 
                         ?? _configuration["JwtSettings:Secret"] 
                         ?? "assetflow_secret_key_2025_assetflow_secret_key_2025_secure";
            var key = Encoding.ASCII.GetBytes(secret);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, roleName),
                new Claim("role", roleName),
            };

            if (company != null)
            {
                claims.Add(new Claim("companyId", company.Id.ToString()));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["JwtSettings:Issuer"] ?? "AssetFlow",
                Audience = _configuration["JwtSettings:Audience"] ?? "AssetFlowUsers"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return tokenHandler.WriteToken(token);
        }
    }
}

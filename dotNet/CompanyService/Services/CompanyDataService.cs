using System.Text.Json;
using CompanyService.Data;
using CompanyService.DTOs;
using CompanyService.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Services
{
    public class CompanyDataService : ICompanyDataService
    {
        private readonly CompanyDbContext _db;

        public CompanyDataService(CompanyDbContext db)
        {
            _db = db;
        }

        private async Task EnsureOwnedAsync(string type, long id, long companyId)
        {
            bool exists = type switch
            {
                "department" => await _db.Departments.AnyAsync(d => d.DepartmentId == id && d.CompanyId == companyId),
                "location" => await _db.Locations.AnyAsync(l => l.LocationId == id && l.CompanyId == companyId),
                "employee" or "admin" => await _db.Users.AnyAsync(u => u.UserId == id && u.CompanyId == companyId),
                _ => await _db.Companies.AnyAsync(c => c.CompanyId == id && c.CompanyId == companyId) // Actually default is companies
            };

            if (!exists)
            {
                throw new KeyNotFoundException("Resource not found");
            }
        }

        public async Task<object> ListAsync(string type, long companyId, string? search)
        {
            return type switch
            {
                "department" => await _db.Departments
                    .Where(d => d.CompanyId == companyId && d.IsActive == true && (string.IsNullOrEmpty(search) || d.DepartmentName.Contains(search)))
                    .ToListAsync(),
                "location" => await _db.Locations
                    .Where(l => l.CompanyId == companyId && l.IsActive == true && (string.IsNullOrEmpty(search) || l.LocationName.Contains(search)))
                    .ToListAsync(),
                "employee" or "admin" => await _db.Users
                    .Where(u => u.CompanyId == companyId && u.IsActive == true && (string.IsNullOrEmpty(search) || u.Email.Contains(search)))
                    .ToListAsync(),
                _ => await _db.Companies
                    .Where(c => c.CompanyId == companyId && c.IsActive == true && (string.IsNullOrEmpty(search) || c.CompanyName.Contains(search)))
                    .ToListAsync()
            };
        }

        public async Task<object> OneAsync(string type, long companyId, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

            return type switch
            {
                "department" => await _db.Departments.FindAsync(id) ?? throw new KeyNotFoundException(),
                "location" => await _db.Locations.FindAsync(id) ?? throw new KeyNotFoundException(),
                "employee" or "admin" => await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException(),
                _ => await _db.Companies.FindAsync(id) ?? throw new KeyNotFoundException()
            };
        }

        public async Task<object> CreateAsync(string type, long companyId, JsonElement body)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            switch (type)
            {
                case "department":
                    var deptDto = body.Deserialize<DepartmentDto>(options)!;
                    var dept = new Department
                    {
                        CompanyId = companyId,
                        DepartmentName = deptDto.Name,
                        Description = deptDto.Description,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Departments.Add(dept);
                    break;
                case "location":
                    var locDto = body.Deserialize<LocationDto>(options)!;
                    var loc = new Location
                    {
                        CompanyId = companyId,
                        LocationName = locDto.Name,
                        Address = locDto.Address,
                        City = locDto.City,
                        State = locDto.State,
                        Country = locDto.Country,
                        PostalCode = locDto.PostalCode,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Locations.Add(loc);
                    break;
                case "employee":
                case "admin":
                    var userDto = body.Deserialize<UserDto>(options)!;
                    var roleName = type == "admin" ? "COMPANY_ADMIN" : "EMPLOYEE";
                    var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName);

                    if (role == null) throw new InvalidOperationException($"Role {roleName} not found");

                    var user = new User
                    {
                        CompanyId = companyId,
                        DepartmentId = userDto.DepartmentId,
                        RoleId = role.RoleId,
                        FirstName = userDto.FirstName,
                        LastName = userDto.LastName,
                        Email = userDto.Email,
                        Password = userDto.Password,
                        Phone = userDto.Phone,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Users.Add(user);
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await _db.SaveChangesAsync();
            return body;
        }

        public async Task<object> UpdateAsync(string type, long companyId, long id, JsonElement body)
        {
            await EnsureOwnedAsync(type, id, companyId);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            switch (type)
            {
                case "department":
                    var dept = await _db.Departments.FindAsync(id);
                    var deptDto = body.Deserialize<DepartmentDto>(options)!;
                    dept!.DepartmentName = deptDto.Name;
                    dept.Description = deptDto.Description;
                    dept.UpdatedAt = DateTime.UtcNow;
                    break;
                case "location":
                    var loc = await _db.Locations.FindAsync(id);
                    var locDto = body.Deserialize<LocationDto>(options)!;
                    loc!.LocationName = locDto.Name;
                    loc.Address = locDto.Address;
                    loc.City = locDto.City;
                    loc.State = locDto.State;
                    loc.Country = locDto.Country;
                    loc.PostalCode = locDto.PostalCode;
                    loc.UpdatedAt = DateTime.UtcNow;
                    break;
                case "employee":
                case "admin":
                    var user = await _db.Users.FindAsync(id);
                    var userDto = body.Deserialize<UserDto>(options)!;
                    user!.FirstName = userDto.FirstName;
                    user.LastName = userDto.LastName;
                    user.Phone = userDto.Phone;
                    user.DepartmentId = userDto.DepartmentId;
                    user.UpdatedAt = DateTime.UtcNow;
                    break;
            }

            await _db.SaveChangesAsync();
            return await OneAsync(type, companyId, id);
        }

        public async Task DeleteAsync(string type, long companyId, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

            switch (type)
            {
                case "department":
                    var dept = await _db.Departments.FindAsync(id);
                    dept!.IsActive = false;
                    dept.UpdatedAt = DateTime.UtcNow;
                    break;
                case "location":
                    var loc = await _db.Locations.FindAsync(id);
                    loc!.IsActive = false;
                    loc.UpdatedAt = DateTime.UtcNow;
                    break;
                case "employee":
                case "admin":
                    var user = await _db.Users.FindAsync(id);
                    user!.IsActive = false;
                    user.UpdatedAt = DateTime.UtcNow;
                    break;
            }

            await _db.SaveChangesAsync();
        }
    }
}

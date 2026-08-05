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
                _ => await _db.Companies.AnyAsync(c => c.CompanyId == id && c.CompanyId == companyId)
            };

            if (!exists)
            {
                throw new KeyNotFoundException("Resource not found");
            }
        }

        private async Task AuditAsync(long companyId, long userId, string module, string action, long? entityId, string description)
        {
            _db.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                UserId = userId,
                Module = module,
                Action = action,
                EntityId = entityId,
                Description = description,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        public async Task<object> ListAsync(string type, long companyId, long userId, string role, string? search, int page, int size)
        {
            page = Math.Max(0, page);
            size = Math.Clamp(size, 1, 100);

            if (role == "EMPLOYEE" && type != "employee")
            {
                throw new UnauthorizedAccessException("Employee access is limited to their own profile");
            }

            switch (type)
            {
                case "department":
                    var deptQuery = _db.Departments.Where(d => d.CompanyId == companyId && d.IsActive == true);
                    if (!string.IsNullOrEmpty(search))
                        deptQuery = deptQuery.Where(d => d.DepartmentName.Contains(search));
                    return await deptQuery.OrderByDescending(d => d.DepartmentId).Skip(page * size).Take(size).ToListAsync();

                case "location":
                    var locQuery = _db.Locations.Where(l => l.CompanyId == companyId && l.IsActive == true);
                    if (!string.IsNullOrEmpty(search))
                        locQuery = locQuery.Where(l => l.LocationName.Contains(search));
                    return await locQuery.OrderByDescending(l => l.LocationId).Skip(page * size).Take(size).ToListAsync();

                case "employee":
                case "admin":
                    var roleName = type == "admin" ? "COMPANY_ADMIN" : "EMPLOYEE";
                    var userQuery = _db.Users.Where(u => u.CompanyId == companyId && u.IsActive == true && u.Role.RoleName == roleName);

                    if (role == "EMPLOYEE")
                    {
                        userQuery = userQuery.Where(u => u.UserId == userId);
                    }

                    if (!string.IsNullOrEmpty(search))
                        userQuery = userQuery.Where(u => u.Email.Contains(search) || u.FirstName.Contains(search) || u.LastName.Contains(search));

                    return await userQuery.OrderByDescending(u => u.UserId).Skip(page * size).Take(size).ToListAsync();

                default:
                    var compQuery = _db.Companies.Where(c => c.CompanyId == companyId && c.IsActive == true);
                    if (!string.IsNullOrEmpty(search))
                        compQuery = compQuery.Where(c => c.CompanyName.Contains(search));
                    return await compQuery.OrderByDescending(c => c.CompanyId).Skip(page * size).Take(size).ToListAsync();
            }
        }

        public async Task<object> OneAsync(string type, long companyId, long userId, string role, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

            if (role == "EMPLOYEE" && (type != "employee" || userId != id))
            {
                throw new UnauthorizedAccessException("Employee access is limited to their own profile");
            }

            return type switch
            {
                "department" => await _db.Departments.FindAsync(id) ?? throw new KeyNotFoundException(),
                "location" => await _db.Locations.FindAsync(id) ?? throw new KeyNotFoundException(),
                "employee" or "admin" => await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException(),
                _ => await _db.Companies.FindAsync(id) ?? throw new KeyNotFoundException()
            };
        }

        public async Task<object> CreateAsync(string type, long companyId, long userId, JsonElement body)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            long? entityId = null;

            switch (type)
            {
                case "department":
                    var deptDto = body.Deserialize<DepartmentDto>(options)!;
                    if (string.IsNullOrWhiteSpace(deptDto.Name)) throw new ArgumentException("Department name is required");
                    var dept = new Department
                    {
                        CompanyId = companyId,
                        DepartmentName = deptDto.Name,
                        Description = deptDto.Description,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Departments.Add(dept);
                    await _db.SaveChangesAsync();
                    entityId = dept.DepartmentId;
                    break;
                case "location":
                    var locDto = body.Deserialize<LocationDto>(options)!;
                    if (string.IsNullOrWhiteSpace(locDto.Name)) throw new ArgumentException("Location name is required");
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
                    await _db.SaveChangesAsync();
                    entityId = loc.LocationId;
                    break;
                case "employee":
                case "admin":
                    var userDto = body.Deserialize<UserDto>(options)!;
                    if (string.IsNullOrWhiteSpace(userDto.Email)) throw new ArgumentException("Email is required");
                    if (string.IsNullOrWhiteSpace(userDto.Password) || userDto.Password.Length < 8) throw new ArgumentException("A password of at least 8 characters is required");
                    if (await _db.Users.AnyAsync(u => u.Email == userDto.Email)) throw new ArgumentException("Email is already registered");
                    if (userDto.DepartmentId.HasValue && !await _db.Departments.AnyAsync(d => d.DepartmentId == userDto.DepartmentId && d.CompanyId == companyId)) throw new ArgumentException("Department does not belong to this company");

                    var roleName = type == "admin" ? "COMPANY_ADMIN" : "EMPLOYEE";
                    var roleObj = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName);

                    if (roleObj == null) throw new InvalidOperationException($"Role {roleName} not found");

                    var user = new User
                    {
                        CompanyId = companyId,
                        DepartmentId = userDto.DepartmentId,
                        RoleId = roleObj.RoleId,
                        FirstName = userDto.FirstName,
                        LastName = userDto.LastName,
                        Email = userDto.Email,
                        Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
                        Phone = userDto.Phone,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Users.Add(user);
                    await _db.SaveChangesAsync();
                    entityId = user.UserId;
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await AuditAsync(companyId, userId, type, "CREATE", entityId, $"Created {type}");
            return await OneAsync(type, companyId, userId, "COMPANY_ADMIN", entityId.Value);
        }

        public async Task<object> ImportEmployeesAsync(long companyId, long userId, List<JsonElement> rows)
        {
            int ok = 0;
            var bad = new List<object>();

            for (int i = 0; i < (rows?.Count ?? 0); i++)
            {
                try
                {
                    await CreateAsync("employee", companyId, userId, rows![i]);
                    ok++;
                }
                catch (Exception e)
                {
                    bad.Add(new { row = i + 1, reason = e.Message });
                }
            }

            return new { accepted = ok, rejected = bad, total = rows?.Count ?? 0 };
        }

        public async Task<object> UpdateAsync(string type, long companyId, long userId, long id, JsonElement body)
        {
            await EnsureOwnedAsync(type, id, companyId);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            switch (type)
            {
                case "department":
                    var dept = await _db.Departments.FindAsync(id);
                    var deptDto = body.Deserialize<DepartmentDto>(options)!;
                    if (string.IsNullOrWhiteSpace(deptDto.Name)) throw new ArgumentException("Department name is required");
                    dept!.DepartmentName = deptDto.Name;
                    dept.Description = deptDto.Description;
                    dept.UpdatedAt = DateTime.UtcNow;
                    break;
                case "location":
                    var loc = await _db.Locations.FindAsync(id);
                    var locDto = body.Deserialize<LocationDto>(options)!;
                    if (string.IsNullOrWhiteSpace(locDto.Name)) throw new ArgumentException("Location name is required");
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
                    if (userDto.DepartmentId.HasValue && !await _db.Departments.AnyAsync(d => d.DepartmentId == userDto.DepartmentId && d.CompanyId == companyId)) throw new ArgumentException("Department does not belong to this company");
                    user!.FirstName = userDto.FirstName;
                    user.LastName = userDto.LastName;
                    user.Phone = userDto.Phone;
                    user.DepartmentId = userDto.DepartmentId;
                    user.UpdatedAt = DateTime.UtcNow;
                    break;
            }

            await _db.SaveChangesAsync();
            await AuditAsync(companyId, userId, type, "UPDATE", id, $"Updated {type}");
            return await OneAsync(type, companyId, userId, "COMPANY_ADMIN", id);
        }

        public async Task DeleteAsync(string type, long companyId, long userId, long id)
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
            await AuditAsync(companyId, userId, type, "DELETE", id, $"Deactivated {type}");
        }
    }
}

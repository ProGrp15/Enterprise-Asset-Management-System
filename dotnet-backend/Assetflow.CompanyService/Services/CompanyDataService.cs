using Dapper;
using MySqlConnector;

namespace Assetflow.CompanyService.Services
{
    public class CompanyDataService
    {
        private readonly MySqlConnection _db;

        public CompanyDataService(MySqlConnection db)
        {
            _db = db;
        }

        public async Task<IEnumerable<IDictionary<string, object>>> ListAsync(string type, long company, long actor, string role, string? q, int page, int size)
        {
            page = Math.Max(0, page);
            size = Math.Min(Math.Max(1, size), 100);
            
            var sql = BaseQuery(type);
            var parameters = new DynamicParameters();
            parameters.Add("company", company);

            if (!string.IsNullOrWhiteSpace(q))
            {
                string f = type is "employee" or "admin"
                    ? "(u.email like @q or u.first_name like @q or u.last_name like @q or d.department_name like @q)"
                    : type == "department"
                    ? "(d.department_name like @q or d.description like @q)"
                    : "(l.location_name like @q or l.city like @q or l.state like @q)";
                
                sql += " and " + f;
                parameters.Add("q", $"%{q}%");
            }

            if (type is "employee" or "admin")
            {
                sql += " and u.role_id=(select role_id from roles where role_name=@roleName)";
                parameters.Add("roleName", type == "admin" ? "COMPANY_ADMIN" : "EMPLOYEE");
            }

            if (role == "EMPLOYEE")
            {
                if (type != "employee") throw new UnauthorizedAccessException("Employee access is limited to their own profile");
                sql += " and u.user_id=@actor";
                parameters.Add("actor", actor);
            }

            sql += $" order by {QualifiedKey(type)} desc limit @size offset @offset";
            parameters.Add("size", size);
            parameters.Add("offset", page * size);

            var result = await _db.QueryAsync<dynamic>(sql, parameters);
            return result.Cast<IDictionary<string, object>>();
        }

        public async Task<IDictionary<string, object>> OneAsync(string type, long company, long actor, string role, long id)
        {
            await OwnedAsync(type, company, id);
            if (role == "EMPLOYEE" && (type != "employee" || actor != id))
            {
                throw new UnauthorizedAccessException("Employee access is limited to their own profile");
            }
            
            var sql = BaseQuery(type) + $" and {QualifiedKey(type)}=@id";
            var result = await _db.QuerySingleOrDefaultAsync<dynamic>(sql, new { company, id });
            return (IDictionary<string, object>)result;
        }

        public async Task<IDictionary<string, object>> CreateAsync(string type, long company, long actor, IDictionary<string, object> b)
        {
            await ValidateCreateAsync(type, company, b);
            
            long newId;
            switch (type)
            {
                case "department":
                    var depName = b.ContainsKey("departmentName") ? b["departmentName"] : b["name"];
                    b.TryGetValue("description", out var depDesc);
                    await _db.ExecuteAsync("insert into departments(company_id,department_name,description) values(@company,@name,@desc)",
                        new { company, name = depName?.ToString(), desc = depDesc?.ToString() });
                    break;
                case "location":
                    var locName = b.ContainsKey("locationName") ? b["locationName"] : b["name"];
                    b.TryGetValue("address", out var addr);
                    b.TryGetValue("city", out var city);
                    b.TryGetValue("state", out var state);
                    b.TryGetValue("country", out var country);
                    b.TryGetValue("postalCode", out var postalCode);
                    await _db.ExecuteAsync("insert into locations(company_id,location_name,address,city,state,country,postal_code) values(@company,@name,@addr,@city,@state,@country,@postalCode)",
                        new { company, name = locName?.ToString(), addr = addr?.ToString(), city = city?.ToString(), state = state?.ToString(), country = country?.ToString(), postalCode = postalCode?.ToString() });
                    break;
                case "employee":
                case "admin":
                    var r = await _db.QuerySingleAsync<long>("select role_id from roles where role_name=@roleName", new { roleName = type == "admin" ? "COMPANY_ADMIN" : "EMPLOYEE" });
                    b.TryGetValue("departmentId", out var dId);
                    b.TryGetValue("firstName", out var fn);
                    b.TryGetValue("lastName", out var ln);
                    b.TryGetValue("email", out var em);
                    b.TryGetValue("password", out var pw);
                    b.TryGetValue("phone", out var ph);
                    var hashedPw = BCrypt.Net.BCrypt.HashPassword(pw?.ToString() ?? "");
                    await _db.ExecuteAsync("insert into users(company_id,department_id,role_id,first_name,last_name,email,password,phone) values(@company,@dId,@r,@fn,@ln,@em,@hashedPw,@ph)",
                        new { company, dId, r, fn = fn?.ToString(), ln = ln?.ToString(), em = em?.ToString(), hashedPw, ph = ph?.ToString() });
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }
            
            newId = await _db.QuerySingleAsync<long>($"select {Key(type)} from {Table(type)} where company_id=@company order by {Key(type)} desc limit 1", new { company });
            await AuditAsync(company, actor, type, "CREATE", newId.ToString(), $"Created {type}");
            return await OneAsync(type, company, actor, "COMPANY_ADMIN", newId);
        }

        public async Task<IDictionary<string, object>> ImportEmployeesAsync(long company, long actor, IEnumerable<IDictionary<string, object>> rows)
        {
            int ok = 0;
            var bad = new List<IDictionary<string, object>>();
            int i = 0;
            
            foreach (var row in rows)
            {
                try
                {
                    await CreateAsync("employee", company, actor, row);
                    ok++;
                }
                catch (Exception e)
                {
                    bad.Add(new Dictionary<string, object>
                    {
                        { "row", i + 1 },
                        { "reason", e.Message }
                    });
                }
                i++;
            }
            
            return new Dictionary<string, object>
            {
                { "accepted", ok },
                { "rejected", bad },
                { "total", i }
            };
        }

        public async Task<IDictionary<string, object>> UpdateAsync(string type, long company, long actor, long id, IDictionary<string, object> b)
        {
            await OwnedAsync(type, company, id);
            await ValidateUpdateAsync(type, company, b);
            
            if (type == "department")
            {
                var name = b.ContainsKey("departmentName") ? b["departmentName"] : b["name"];
                b.TryGetValue("description", out var desc);
                var isActive = b.TryGetValue("isActive", out var ia) ? (bool)ia : true;
                await _db.ExecuteAsync("update departments set department_name=@name,description=@desc,is_active=@isActive where department_id=@id and company_id=@company",
                    new { name = name?.ToString(), desc = desc?.ToString(), isActive, id, company });
            }
            else if (type == "location")
            {
                var name = b.ContainsKey("locationName") ? b["locationName"] : b["name"];
                b.TryGetValue("address", out var addr);
                b.TryGetValue("city", out var city);
                b.TryGetValue("state", out var state);
                b.TryGetValue("country", out var country);
                b.TryGetValue("postalCode", out var postalCode);
                var isActive = b.TryGetValue("isActive", out var ia) ? (bool)ia : true;
                await _db.ExecuteAsync("update locations set location_name=@name,address=@addr,city=@city,state=@state,country=@country,postal_code=@postalCode,is_active=@isActive where location_id=@id and company_id=@company",
                    new { name = name?.ToString(), addr = addr?.ToString(), city = city?.ToString(), state = state?.ToString(), country = country?.ToString(), postalCode = postalCode?.ToString(), isActive, id, company });
            }
            else if (type is "employee" or "admin")
            {
                b.TryGetValue("firstName", out var fn);
                b.TryGetValue("lastName", out var ln);
                b.TryGetValue("phone", out var ph);
                b.TryGetValue("departmentId", out var dId);
                var isActive = b.TryGetValue("isActive", out var ia) ? (bool)ia : true;
                await _db.ExecuteAsync("update users set first_name=@fn,last_name=@ln,phone=@ph,department_id=@dId,is_active=@isActive where user_id=@id and company_id=@company",
                    new { fn = fn?.ToString(), ln = ln?.ToString(), ph = ph?.ToString(), dId, isActive, id, company });
            }
            else
            {
                throw new ArgumentException("Unsupported resource");
            }
            
            var row = await OneAsync(type, company, actor, "COMPANY_ADMIN", id);
            await AuditAsync(company, actor, type, "UPDATE", id.ToString(), $"Updated {type}");
            return row;
        }

        public async Task DeleteAsync(string type, long company, long actor, long id)
        {
            await OwnedAsync(type, company, id);
            await _db.ExecuteAsync($"update {Table(type)} set is_active=false where {Key(type)}=@id and company_id=@company", new { id, company });
            await AuditAsync(company, actor, type, "DELETE", id.ToString(), $"Deactivated {type}");
        }

        private string BaseQuery(string type)
        {
            return type switch
            {
                "department" => "select d.*, d.department_name as name, (select count(*) from users u where u.department_id=d.department_id and u.company_id=d.company_id and u.is_active=true) as total_employees from departments d where d.company_id=@company and d.is_active=true",
                "location" => "select l.*, l.location_name as name, (select count(*) from assets a where a.location_id=l.location_id and a.company_id=l.company_id and a.is_active=true) as total_assets from locations l where l.company_id=@company and l.is_active=true",
                "employee" or "admin" => "select u.user_id, u.company_id, u.department_id, u.role_id, u.first_name, u.last_name, concat(u.first_name, ' ', u.last_name) as full_name, u.email, u.phone, u.is_active, u.created_at, u.updated_at, d.department_name, r.role_name as role, r.role_name as role_name from users u left join departments d on d.department_id=u.department_id join roles r on r.role_id=u.role_id where u.company_id=@company and u.is_active=true",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private string QualifiedKey(string type)
        {
            return type switch
            {
                "department" => "d.department_id",
                "location" => "l.location_id",
                "employee" or "admin" => "u.user_id",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }
        
        private string Table(string type)
        {
            return type switch
            {
                "department" => "departments",
                "location" => "locations",
                "employee" or "admin" => "users",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private string Key(string type)
        {
            return type switch
            {
                "department" => "department_id",
                "location" => "location_id",
                "employee" or "admin" => "user_id",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private async Task ValidateCreateAsync(string type, long company, IDictionary<string, object> b)
        {
            if (type is "employee" or "admin")
            {
                if (!b.TryGetValue("password", out var pw) || string.IsNullOrWhiteSpace(pw?.ToString()) || pw.ToString()!.Length < 8)
                    throw new ArgumentException("A password of at least 8 characters is required");
                if (!b.TryGetValue("email", out var email) || string.IsNullOrWhiteSpace(email?.ToString()))
                    throw new ArgumentException("Email is required");
                
                var count = await _db.QuerySingleOrDefaultAsync<int>("select count(*) from users where email=@email", new { email = email.ToString() });
                if (count > 0) throw new ArgumentException("Email is already registered");
            }
            ValidateNames(type, b);
            await ValidateDepartmentAsync(company, b);
        }

        private async Task ValidateUpdateAsync(string type, long company, IDictionary<string, object> b)
        {
            if (type is "employee" or "admin")
            {
                if ((!b.TryGetValue("firstName", out var fn) || string.IsNullOrWhiteSpace(fn?.ToString())) && 
                    (!b.TryGetValue("lastName", out var ln) || string.IsNullOrWhiteSpace(ln?.ToString())))
                {
                    throw new ArgumentException("First and last name are required");
                }
            }
            ValidateNames(type, b);
            await ValidateDepartmentAsync(company, b);
        }

        private void ValidateNames(string type, IDictionary<string, object> b)
        {
            var depName = b.ContainsKey("departmentName") ? b["departmentName"] : b.ContainsKey("name") ? b["name"] : null;
            var locName = b.ContainsKey("locationName") ? b["locationName"] : b.ContainsKey("name") ? b["name"] : null;
            
            if (type == "department" && string.IsNullOrWhiteSpace(depName?.ToString()))
                throw new ArgumentException("Department name is required");
            if (type == "location" && string.IsNullOrWhiteSpace(locName?.ToString()))
                throw new ArgumentException("Location name is required");
        }

        private async Task ValidateDepartmentAsync(long company, IDictionary<string, object> b)
        {
            if (b.TryGetValue("departmentId", out var dId) && dId != null && !string.IsNullOrWhiteSpace(dId.ToString()))
            {
                var count = await _db.QuerySingleOrDefaultAsync<int>("select count(*) from departments where department_id=@dId and company_id=@company", new { dId, company });
                if (count == 0) throw new ArgumentException("Department does not belong to this company");
            }
        }

        private async Task OwnedAsync(string type, long company, long id)
        {
            var count = await _db.QuerySingleOrDefaultAsync<int>($"select count(*) from {Table(type)} where {Key(type)}=@id and company_id=@company", new { id, company });
            if (count == 0) throw new KeyNotFoundException("Resource not found");
        }

        private async Task AuditAsync(long company, long user, string module, string action, string entityId, string description)
        {
            try
            {
                await _db.ExecuteAsync("insert into audit_logs(company_id,user_id,module,action,entity_id,description) values(@company,@user,@module,@action,@entityId,@description)",
                    new { company, user, module, action, entityId, description });
            }
            catch { /* ignored */ }
        }
    }
}

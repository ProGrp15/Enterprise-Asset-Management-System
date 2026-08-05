using System.Net;
using System.Net.Mail;
using System.Text.Json;
using MySqlConnector;

namespace Assetflow.NotificationService;

public sealed class NotificationDataService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? $"Server={configuration["Database:Host"] ?? "localhost"};Port={configuration["Database:Port"] ?? "3306"};Database={configuration["Database:Name"] ?? "assetflow_db"};User ID={configuration["Database:User"] ?? "root"};Password={configuration["Database:Password"] ?? Environment.GetEnvironmentVariable("SPRING_DATASOURCE_PASSWORD") ?? "Astrixz"};Allow User Variables=True;";

    private MySqlConnection Connection() => new(_connectionString);
    private static long Number(IReadOnlyDictionary<string, string?> claims, string name) => long.TryParse(claims.GetValueOrDefault(name), out var value) ? value : 0;
    private static long Company(IReadOnlyDictionary<string, string?> claims) => Number(claims, "companyId");
    private static long User(IReadOnlyDictionary<string, string?> claims) => Number(claims, "sub");
    private static object? Value(IReadOnlyDictionary<string, object?> body, string name, object? fallback = null) => Normalize(body.GetValueOrDefault(name) ?? fallback);
    private static object? Normalize(object? value) => value is not JsonElement json ? value : json.ValueKind switch
    {
        JsonValueKind.Null => null,
        JsonValueKind.String => json.GetString(),
        JsonValueKind.Number when json.TryGetInt64(out var integer) => integer,
        JsonValueKind.Number when json.TryGetDecimal(out var decimalValue) => decimalValue,
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        _ => json.GetRawText()
    };

    public async Task<List<Dictionary<string, object?>>> NotificationsAsync(IReadOnlyDictionary<string, string?> c)
    {
        await using var db = Connection(); await db.OpenAsync();
        return await QueryAsync(db, "select * from notifications where company_id=@company and (user_id=@user or user_id=0) order by created_at desc", ("@company", Company(c)), ("@user", User(c)));
    }

    public async Task<Dictionary<string, object?>> CreateNotificationAsync(IReadOnlyDictionary<string, string?> c, IReadOnlyDictionary<string, object?> body)
    {
        await using var db = Connection(); await db.OpenAsync();
        await using var cmd = new MySqlCommand("insert into notifications(company_id,user_id,title,message) values(@company,@user,@title,@message)", db);
        cmd.Parameters.AddWithValue("@company", Company(c)); cmd.Parameters.AddWithValue("@user", Value(body, "userId", User(c)));
        cmd.Parameters.AddWithValue("@title", Value(body, "title", "AssetFlow notification")); cmd.Parameters.AddWithValue("@message", Value(body, "message", ""));
        await cmd.ExecuteNonQueryAsync(); return body.ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    public Task<int> ReadAsync(IReadOnlyDictionary<string, string?> c, long id) => ExecuteAsync("update notifications set is_read=true where notification_id=@id and company_id=@company", ("@id", id), ("@company", Company(c)));
    public Task<int> DeleteAsync(IReadOnlyDictionary<string, string?> c, long id) => ExecuteAsync("delete from notifications where notification_id=@id and company_id=@company and (user_id=@user or user_id=0)", ("@id", id), ("@company", Company(c)), ("@user", User(c)));
    public Task<int> ReadAllAsync(IReadOnlyDictionary<string, string?> c) => ExecuteAsync("update notifications set is_read=true where company_id=@company and (user_id=@user or user_id=0)", ("@company", Company(c)), ("@user", User(c)));

    public async Task<List<Dictionary<string, object?>>> AuditsAsync(IReadOnlyDictionary<string, string?> c)
    {
        await using var db = Connection(); await db.OpenAsync();
        var employee = string.Equals(c.GetValueOrDefault("role"), "EMPLOYEE", StringComparison.Ordinal);
        var sql = employee ? "select * from audit_logs where company_id=@company and user_id=@user order by created_at desc limit 200" : "select * from audit_logs where company_id=@company order by created_at desc limit 200";
        return await QueryAsync(db, sql, ("@company", Company(c)), ("@user", User(c)));
    }

    public async Task<Dictionary<string, object?>> CreateAuditAsync(IReadOnlyDictionary<string, string?> c, IReadOnlyDictionary<string, object?> body)
    {
        await using var db = Connection(); await db.OpenAsync();
        await using var cmd = new MySqlCommand("insert into audit_logs(company_id,user_id,module,action,entity_id,description,ip_address) values(@company,@user,@module,@action,@entity,@description,@ip)", db);
        cmd.Parameters.AddWithValue("@company", Company(c)); cmd.Parameters.AddWithValue("@user", User(c)); cmd.Parameters.AddWithValue("@module", Value(body, "module", "unknown")); cmd.Parameters.AddWithValue("@action", Value(body, "action", "unknown")); cmd.Parameters.AddWithValue("@entity", Value(body, "entityId")); cmd.Parameters.AddWithValue("@description", Value(body, "description")); cmd.Parameters.AddWithValue("@ip", Value(body, "ipAddress"));
        await cmd.ExecuteNonQueryAsync(); return new(body);
    }

    public async Task<Dictionary<string, long>> DashboardAsync(IReadOnlyDictionary<string, string?> c)
    {
        var employee = string.Equals(c.GetValueOrDefault("role"), "EMPLOYEE", StringComparison.Ordinal); var scope = employee ? " and user_id=@user" : "";
        return new() { ["notifications"] = await CountAsync($"select count(*) from notifications where company_id=@company{scope}", c, employee), ["unreadNotifications"] = await CountAsync($"select count(*) from notifications where company_id=@company and is_read=false{scope}", c, employee), ["auditEvents"] = await CountAsync($"select count(*) from audit_logs where company_id=@company{scope}", c, employee) };
    }

    public async Task<List<Dictionary<string, object?>>> ReportAsync(string type, IReadOnlyDictionary<string, string?> c)
    {
        var sql = type.ToLowerInvariant() switch { "assets" => "select status,count(*) total from assets where company_id=@company group by status", "users" or "employees" => "select r.role_name,count(*) total from users u join roles r on r.role_id=u.role_id where u.company_id=@company group by r.role_name", "departments" => "select d.department_name,count(u.user_id) total from departments d left join users u on u.department_id=d.department_id and u.company_id=d.company_id where d.company_id=@company group by d.department_id,d.department_name", "vendors" => "select is_active,count(*) total from vendors where company_id=@company group by is_active", "maintenance" => "select status,count(*) total from service_tickets where company_id=@company group by status", "requests" => "select status,count(*) total from asset_requests where company_id=@company group by status", "audit" => "select module,count(*) total from audit_logs where company_id=@company group by module order by total desc", _ => "select status,count(*) total from purchase_orders where company_id=@company group by status" };
        await using var db = Connection(); await db.OpenAsync(); return await QueryAsync(db, sql, ("@company", Company(c)));
    }

    public async Task<Dictionary<string, object?>> ChatAsync(IReadOnlyDictionary<string, object?> body, IReadOnlyDictionary<string, string?>? claims = null)
    {
        var key = configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY"); var question = Convert.ToString(Value(body, "message", "")) ?? "";
        if (string.IsNullOrWhiteSpace(key)) return new() { ["reply"] = "Gemini is not configured yet. Set GEMINI_API_KEY to enable company-aware answers.", ["configured"] = false };
        var model = configuration["Gemini:Model"] ?? Environment.GetEnvironmentVariable("GEMINI_MODEL") ?? "gemini-2.0-flash";
        var payload = new { contents = new[] { new { parts = new[] { new { text = question } } } } };
        try { var client = httpClientFactory.CreateClient(); var response = await client.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={WebUtility.UrlEncode(key)}", payload); using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()); var text = json.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "Gemini returned no readable text."; return new() { ["reply"] = text, ["configured"] = true }; }
        catch { return new() { ["reply"] = "Gemini is configured but unavailable. Verify the key, model access, and network connection.", ["configured"] = true, ["providerError"] = true }; }
    }

    public async Task<bool> SendEmailAsync(EmailRequest request)
    {
        var from = configuration["Mail:Username"] ?? Environment.GetEnvironmentVariable("MAIL_USERNAME"); if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(request.To)) return false;
        using var client = new SmtpClient(configuration["Mail:Host"] ?? Environment.GetEnvironmentVariable("MAIL_HOST") ?? "localhost", int.TryParse(configuration["Mail:Port"] ?? Environment.GetEnvironmentVariable("MAIL_PORT"), out var port) ? port : 587) { EnableSsl = true, Credentials = new NetworkCredential(from, configuration["Mail:Password"] ?? Environment.GetEnvironmentVariable("MAIL_PASSWORD")) };
        await client.SendMailAsync(new MailMessage(from, request.To, request.Subject ?? "AssetFlow notification", request.Body ?? "")); return true;
    }

    private async Task<long> CountAsync(string sql, IReadOnlyDictionary<string, string?> c, bool employee) { await using var db = Connection(); await db.OpenAsync(); await using var cmd = new MySqlCommand(sql, db); cmd.Parameters.AddWithValue("@company", Company(c)); if (employee) cmd.Parameters.AddWithValue("@user", User(c)); return Convert.ToInt64(await cmd.ExecuteScalarAsync()); }
    private async Task<int> ExecuteAsync(string sql, params (string Name, object? Value)[] values) { await using var db = Connection(); await db.OpenAsync(); await using var cmd = new MySqlCommand(sql, db); foreach (var v in values) cmd.Parameters.AddWithValue(v.Name, v.Value ?? DBNull.Value); return await cmd.ExecuteNonQueryAsync(); }
    private static async Task<List<Dictionary<string, object?>>> QueryAsync(MySqlConnection db, string sql, params (string Name, object? Value)[] values) { await using var cmd = new MySqlCommand(sql, db); foreach (var v in values) cmd.Parameters.AddWithValue(v.Name, v.Value ?? DBNull.Value); await using var reader = await cmd.ExecuteReaderAsync(); var rows = new List<Dictionary<string, object?>>(); while (await reader.ReadAsync()) { var row = new Dictionary<string, object?>(); for (var i = 0; i < reader.FieldCount; i++) row[reader.GetName(i)] = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i); rows.Add(row); } return rows; }
}

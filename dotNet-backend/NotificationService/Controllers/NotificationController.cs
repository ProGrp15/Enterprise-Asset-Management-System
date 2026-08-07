using Microsoft.AspNetCore.Mvc;
using Dapper;
using MySqlConnector;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/v1/notifications")]
public class NotificationController : ControllerBase
{
    private readonly string _connectionString;

    public NotificationController(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection") 
            ?? "Server=localhost;Port=3306;Database=assetflow_db;User=root;";
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        // Example: extract company_id and user_id from JWT
        var companyId = 1;
        var userId = 1;

        using var connection = new MySqlConnection(_connectionString);
        var sql = "SELECT * FROM notifications WHERE company_id = @CompanyId AND (user_id = @UserId OR user_id = 0) ORDER BY created_at DESC";
        var notifications = await connection.QueryAsync(sql, new { CompanyId = companyId, UserId = userId });

        return Ok(new { data = notifications });
    }

    [HttpPost("send")]
    public async Task<IActionResult> CreateNotification([FromBody] NotificationRequest request)
    {
        var companyId = 1; // From JWT
        
        using var connection = new MySqlConnection(_connectionString);
        var sql = "INSERT INTO notifications (company_id, user_id, title, message) VALUES (@CompanyId, @UserId, @Title, @Message)";
        await connection.ExecuteAsync(sql, new 
        { 
            CompanyId = companyId, 
            request.UserId, 
            request.Title, 
            request.Message 
        });

        return Ok(new { message = "Notification sent successfully." });
    }
}

public class NotificationRequest
{
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

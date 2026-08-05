using System.Text;
using Assetflow.NotificationService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("APP_JWT_SECRET")
    ?? "assetflow_secret_key_2025_assetflow_secret_key_2025_secure";

builder.Services.AddSingleton<NotificationDataService>();
builder.Services.AddHttpClient();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType = "email",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (!string.Equals(context.Principal?.FindFirst("type")?.Value, "access", StringComparison.Ordinal))
                    context.Fail("Only access tokens are accepted.");
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
    .WithOrigins("http://localhost:5173")
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddOpenApi();

var app = builder.Build();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/actuator/health", () => Results.Ok(new { status = "UP" }));

var api = app.MapGroup("").RequireAuthorization();
api.MapGet("/notification", async (HttpContext http, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.NotificationsAsync(ClaimsFrom(http)))));
api.MapPost("/notification", async (HttpContext http, Dictionary<string, object?> body, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.CreateNotificationAsync(ClaimsFrom(http), body))));
api.MapPut("/notification/read/{id:long}", async (HttpContext http, long id, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.ReadAsync(ClaimsFrom(http), id))));
api.MapDelete("/notification/{id:long}", async (HttpContext http, long id, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.DeleteAsync(ClaimsFrom(http), id))));
api.MapPut("/notification/read-all", async (HttpContext http, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.ReadAllAsync(ClaimsFrom(http)))));
api.MapGet("/audit", async (HttpContext http, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.AuditsAsync(ClaimsFrom(http)))));
api.MapPost("/audit", async (HttpContext http, Dictionary<string, object?> body, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.CreateAuditAsync(ClaimsFrom(http), body))));
api.MapGet("/dashboard", async (HttpContext http, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.DashboardAsync(ClaimsFrom(http)))));
api.MapGet("/report/{type}", async (HttpContext http, string type, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.ReportAsync(type, ClaimsFrom(http)))));
api.MapPost("/ai/chat", async (HttpContext http, Dictionary<string, object?> body, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.ChatAsync(body, ClaimsFrom(http)))));
api.MapPost("/email/send", async (EmailRequest request, NotificationDataService service) =>
    Results.Ok(ApiResponse.Ok(await service.SendEmailAsync(request))));

if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.Run();

static IReadOnlyDictionary<string, string?> ClaimsFrom(HttpContext http) =>
    http.User.Claims.GroupBy(c => c.Type).ToDictionary(g => g.Key, g => g.First().Value);

public sealed record EmailRequest(string? To, string? Subject, string? Body);
public sealed record ApiResponse(bool Success, object? Data, string? Message, DateTimeOffset Timestamp)
{
    public static ApiResponse Ok(object? data) => new(true, data, null, DateTimeOffset.UtcNow);
}

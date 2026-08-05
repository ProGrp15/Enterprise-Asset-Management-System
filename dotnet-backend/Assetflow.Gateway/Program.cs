using System.Net;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var secret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("APP_JWT_SECRET")
    ?? "assetflow_secret_key_2025_assetflow_secret_key_2025_secure";

builder.Services.AddHttpClient("gateway", client => client.Timeout = TimeSpan.FromSeconds(30));
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal?.FindFirst("type")?.Value != "access") context.Fail("Only access tokens are accepted.");
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
    .WithOrigins("http://localhost:5173")
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/actuator/health", () => Results.Ok(new { status = "UP" }));

app.Run(async context =>
{
    var path = context.Request.Path.Value ?? "/";
    if (!IsPublic(path) && !(context.User.Identity?.IsAuthenticated ?? false))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }

    var target = TargetFor(path, builder.Configuration);
    if (target is null)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(new { message = "No gateway route matches this path." });
        return;
    }

    var client = context.RequestServices.GetRequiredService<IHttpClientFactory>().CreateClient("gateway");
    using var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), target + context.Request.QueryString);
    if (context.Request.ContentLength > 0 || context.Request.Headers.ContainsKey("Transfer-Encoding"))
        request.Content = new StreamContent(context.Request.Body);
    foreach (var header in context.Request.Headers)
    {
        if (!request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray())) request.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
    }

    try
    {
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);
        context.Response.StatusCode = (int)response.StatusCode;
        foreach (var header in response.Headers) context.Response.Headers[header.Key] = header.Value.ToArray();
        foreach (var header in response.Content.Headers) context.Response.Headers[header.Key] = header.Value.ToArray();
        context.Response.Headers.Remove("transfer-encoding");
        await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { }
    catch (HttpRequestException)
    {
        context.Response.StatusCode = StatusCodes.Status502BadGateway;
        await context.Response.WriteAsJsonAsync(new { message = "Target service is unavailable." });
    }
});

app.Run();

static bool IsPublic(string path) => path.StartsWith("/api/auth/login", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/api/auth/register-company", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/api/auth/forgot-password", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/api/auth/reset-password", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/api/auth/refresh-token", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/actuator/health", StringComparison.OrdinalIgnoreCase)
    || path.StartsWith("/eureka/", StringComparison.OrdinalIgnoreCase);

static string? TargetFor(string path, IConfiguration config)
{
    var auth = config["Services:Auth"] ?? "http://localhost:5276";
    var company = config["Services:Company"] ?? "http://localhost:5187";
    var asset = config["Services:Asset"] ?? "http://localhost:5167";
    var notification = config["Services:Notification"] ?? "http://localhost:8084";
    if (path.StartsWith("/api/auth/", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/api/platform/", StringComparison.OrdinalIgnoreCase)) return auth;
    if (new[] { "/api/department/", "/api/employee/", "/api/admin/", "/api/location/", "/api/building/", "/api/floor/", "/api/room/" }.Any(path.StartsWith)) return company;
    if (new[] { "/asset/", "/category/", "/vendor/", "/purchase-order/", "/invoice/", "/maintenance/", "/asset-allocation/", "/asset-request/", "/asset-transfer/", "/asset-return/", "/asset-disposal/", "/repair-history/" }.Any(path.StartsWith)) return asset;
    if (new[] { "/notification", "/audit", "/dashboard", "/report", "/ai", "/email" }.Any(path.StartsWith)) return notification;
    return null;
}

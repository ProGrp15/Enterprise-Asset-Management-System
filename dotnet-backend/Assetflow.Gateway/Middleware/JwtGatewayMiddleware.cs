using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Assetflow.Gateway.Middleware
{
    /// <summary>
    /// JWT validation middleware for the API Gateway.
    /// Validates tokens on secured routes and forwards user claims as headers to downstream services.
    /// </summary>
    public class JwtGatewayMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtGatewayMiddleware> _logger;

        // Paths that don't require authentication
        private static readonly string[] PublicPaths = new[]
        {
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/health",
            "/gateway-info",
            "/swagger",
        };

        public JwtGatewayMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<JwtGatewayMiddleware> logger)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

            // Allow public paths and OPTIONS requests (CORS preflight)
            if (context.Request.Method == "OPTIONS" || IsPublicPath(path))
            {
                await _next(context);
                return;
            }

            // Only validate JWT for /api/** routes
            if (!path.StartsWith("/api/"))
            {
                await _next(context);
                return;
            }

            var token = ExtractToken(context);
            if (string.IsNullOrEmpty(token))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = 401,
                    message = "Missing or invalid Authorization header",
                    timestamp = DateTime.UtcNow
                });
                return;
            }

            try
            {
                var claims = ValidateToken(token);

                // Forward user claims to downstream services via headers
                if (claims.TryGetValue("userId", out var userId))
                    context.Request.Headers["X-User-Id"] = userId;
                if (claims.TryGetValue("role", out var role))
                    context.Request.Headers["X-User-Role"] = role;
                if (claims.TryGetValue("companyId", out var companyId))
                    context.Request.Headers["X-Company-Id"] = companyId;
                if (claims.TryGetValue("email", out var email))
                    context.Request.Headers["X-User-Email"] = email;
                if (claims.TryGetValue("sub", out var sub))
                    context.Request.Headers["X-User-Subject"] = sub;

                await _next(context);
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("Expired JWT token for request: {Path}", path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = 401,
                    message = "Token has expired",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "JWT validation failed for request: {Path}", path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = 401,
                    message = "Invalid or expired token",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        private bool IsPublicPath(string path)
        {
            return PublicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));
        }

        private string? ExtractToken(HttpContext context)
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return authHeader["Bearer ".Length..].Trim();
            }
            return null;
        }

        private Dictionary<string, string> ValidateToken(string token)
        {
            var jwtSecret = _configuration.GetValue<string>("Jwt:Secret") ?? _configuration.GetValue<string>("APP_JWT_SECRET") ?? string.Empty;

            if (string.IsNullOrWhiteSpace(jwtSecret))
            {
                throw new InvalidOperationException("JWT secret is not configured");
            }

            var key = Encoding.UTF8.GetBytes(jwtSecret);
            var handler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);

            var claims = new Dictionary<string, string>();
            foreach (var claim in principal.Claims)
            {
                // Map common claim types
                var claimKey = claim.Type switch
                {
                    "sub" or System.Security.Claims.ClaimTypes.NameIdentifier => "sub",
                    "userId" => "userId",
                    "role" or System.Security.Claims.ClaimTypes.Role => "role",
                    "companyId" => "companyId",
                    "email" or System.Security.Claims.ClaimTypes.Email => "email",
                    _ => claim.Type
                };
                claims.TryAdd(claimKey, claim.Value);
            }

            return claims;
        }
    }

    // Extension method for registering the middleware
    public static class JwtGatewayMiddlewareExtensions
    {
        public static IApplicationBuilder UseJwtGatewayValidation(this IApplicationBuilder app)
        {
            return app.UseMiddleware<JwtGatewayMiddleware>();
        }
    }
}

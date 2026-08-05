using System.Text;
using Assetflow.AuthService.Data;
using Assetflow.AuthService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Parse Environment variables for Secrets
var dbPassword = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_PASSWORD") ?? "Astrixz";
var jwtSecret = Environment.GetEnvironmentVariable("APP_JWT_SECRET") ?? "assetflow_secret_key_2025_assetflow_secret_key_2025_secure";

// Configure DbContext with MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")?.Replace("${SPRING_DATASOURCE_PASSWORD}", dbPassword);
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "AssetFlow",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "AssetFlowUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// Configure DI
builder.Services.AddScoped<IAuthService, Assetflow.AuthService.Services.AuthService>();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

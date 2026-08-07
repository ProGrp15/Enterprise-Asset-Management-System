using System.Text;
using Assetflow.CompanyService.Services;
using Assetflow.Common.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure MySQL Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddTransient<MySqlConnection>(_ => new MySqlConnection(connectionString));

// Add CompanyDataService
builder.Services.AddScoped<CompanyDataService>();

// Register HttpClient and Discovery Registration Service
builder.Services.AddHttpClient("DiscoveryClient");
builder.Services.AddHostedService<DiscoveryRegistrationService>();

// Configure Dapper to map snake_case to CamelCase (or handle it dynamically)
DefaultTypeMap.MatchNamesWithUnderscores = true;

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your_super_secret_jwt_key_that_is_at_least_32_characters_long";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "assetflow",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "assetflow-clients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

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
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint for discovery server
app.MapGet("/health", () => Results.Ok(new { status = "UP", service = "Assetflow.CompanyService", timestamp = DateTime.UtcNow }));

app.Run();

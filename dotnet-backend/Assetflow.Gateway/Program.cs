using Assetflow.Gateway.Middleware;
using Assetflow.Gateway.Services;
using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Configure port to 5000 by default
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add HttpClientFactory for discovery server polling
builder.Services.AddHttpClient("DiscoveryClient");

// Configure YARP Reverse Proxy with in-memory config provider
var inMemoryConfig = new InMemoryConfigProvider(
    new List<RouteConfig>(),
    new List<ClusterConfig>()
);
builder.Services.AddSingleton(inMemoryConfig);

builder.Services.AddReverseProxy();

// Register Dynamic Route Config Provider as background service
builder.Services.AddHostedService<DynamicRouteConfigProvider>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
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

// JWT Validation Middleware (before routing)
app.UseJwtGatewayValidation();

app.UseRouting();
app.UseAuthorization();

// Gateway info endpoint
app.MapGet("/gateway-info", (InMemoryConfigProvider configProvider) =>
{
    var config = configProvider.GetConfig();
    return Results.Ok(new
    {
        service = "Assetflow.Gateway",
        status = "UP",
        timestamp = DateTime.UtcNow,
        routes = config.Routes.Select(r => new { r.RouteId, r.ClusterId, Path = r.Match.Path }),
        clusters = config.Clusters.Select(c => new
        {
            c.ClusterId,
            destinations = c.Destinations?.Select(d => new { d.Key, d.Value.Address })
        })
    });
});

// Health endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "UP",
    service = "Assetflow.Gateway",
    timestamp = DateTime.UtcNow
}));

// Map reverse proxy routes
app.MapReverseProxy();

app.Run();

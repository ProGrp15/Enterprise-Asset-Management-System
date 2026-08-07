using Assetflow.DiscoveryServer.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure port to 5001 by default if not set
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5001);
});

// Add services to the container.
builder.Services.AddControllers()
    .AddXmlDataContractSerializerFormatters();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Singleton Service Registry and Health Checker Hosted Service
builder.Services.AddSingleton<IServiceRegistry, ServiceRegistry>();
builder.Services.AddHostedService<HealthCheckBackgroundService>();

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
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "UP", service = "Assetflow.DiscoveryServer", timestamp = DateTime.UtcNow }));

app.Run();

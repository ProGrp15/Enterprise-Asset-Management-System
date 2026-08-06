var builder = DistributedApplication.CreateBuilder(args);

var authService = builder.AddProject<Projects.Assetflow_AuthService>("authservice");

var companyService = builder.AddProject<Projects.Assetflow_CompanyService>("companyservice");

var assetService = builder.AddProject<Projects.Assetflow_AssetService>("assetservice");

var notificationService = builder.AddProject<Projects.Assetflow_NotificationService>("notificationservice");

var gateway = builder.AddProject<Projects.Assetflow_Gateway>("gateway")
    .WithReference(authService)
    .WithReference(companyService)
    .WithReference(assetService)
    .WithReference(notificationService)
    .WithHttpEndpoint(port: 8080, name: "http");

builder.Build().Run();

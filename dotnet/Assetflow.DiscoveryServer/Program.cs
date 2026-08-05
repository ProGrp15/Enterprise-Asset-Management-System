using System.Collections.Concurrent;
using System.Text.Json;
using System.Xml.Linq;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<DiscoveryRegistry>();
builder.Services.AddOpenApi();

var app = builder.Build();
var registry = app.Services.GetRequiredService<DiscoveryRegistry>();

app.MapGet("/actuator/health", () => Results.Ok(new { status = "UP" }));
app.MapGet("/eureka/apps", (HttpRequest request) => RegistryResult(registry.All(), request));
app.MapGet("/eureka/apps/{appName}", (string appName, HttpRequest request) => RegistryResult(registry.ForApplication(appName), request));

app.MapPost("/eureka/apps/{appName}", async (string appName, HttpRequest request) =>
{
    var instance = await registry.ReadInstanceAsync(appName, request);
    if (instance is null) return Results.BadRequest(new { message = "A valid Eureka instance payload is required." });
    registry.Register(instance);
    return Results.StatusCode(StatusCodes.Status204NoContent);
});

app.MapPut("/eureka/apps/{appName}/{instanceId}", (string appName, string instanceId) =>
    registry.Heartbeat(appName, instanceId) ? Results.Ok() : Results.NotFound());

app.MapDelete("/eureka/apps/{appName}/{instanceId}", (string appName, string instanceId) =>
    registry.Remove(appName, instanceId) ? Results.NoContent() : Results.NotFound());

if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.Run();

static IResult RegistryResult(IReadOnlyCollection<DiscoveryInstance> instances, HttpRequest request)
{
    var wantsXml = request.Headers.Accept.Any(value => value.Contains("xml", StringComparison.OrdinalIgnoreCase));
    if (!wantsXml) return Results.Ok(new { applications = new { application = instances.GroupBy(x => x.App, StringComparer.OrdinalIgnoreCase).Select(group => new { name = group.Key, instance = group.Select(x => new { instanceId = x.InstanceId, hostName = x.HostName, app = x.App, ipAddr = x.IpAddress, status = x.Status, port = x.Port }).ToArray() }) } });

    var applications = new XElement("applications", instances.GroupBy(x => x.App, StringComparer.OrdinalIgnoreCase).Select(group =>
        new XElement("application", new XAttribute("name", group.Key), group.Select(x => x.ToXml()))));
    return Results.Content(applications.ToString(SaveOptions.DisableFormatting), "application/xml");
}

public sealed class DiscoveryRegistry
{
    private readonly ConcurrentDictionary<string, DiscoveryInstance> instances = new(StringComparer.OrdinalIgnoreCase);

    public void Register(DiscoveryInstance instance) => instances[Key(instance.App, instance.InstanceId)] = instance with { LastHeartbeatUtc = DateTimeOffset.UtcNow };
    public bool Heartbeat(string app, string instanceId)
    {
        var key = Key(app, instanceId);
        if (!instances.TryGetValue(key, out var current)) return false;
        instances[key] = current with { LastHeartbeatUtc = DateTimeOffset.UtcNow, Status = "UP" };
        return true;
    }
    public bool Remove(string app, string instanceId) => instances.TryRemove(Key(app, instanceId), out _);
    public IReadOnlyCollection<DiscoveryInstance> All() => Active().ToArray();
    public IReadOnlyCollection<DiscoveryInstance> ForApplication(string app) => Active().Where(x => x.App.Equals(app, StringComparison.OrdinalIgnoreCase)).ToArray();

    public async Task<DiscoveryInstance?> ReadInstanceAsync(string appName, HttpRequest request)
    {
        using var reader = new StreamReader(request.Body);
        var body = await reader.ReadToEndAsync(request.HttpContext.RequestAborted);
        if (string.IsNullOrWhiteSpace(body)) return null;
        return body.TrimStart().StartsWith("<", StringComparison.Ordinal) ? FromXml(appName, body) : FromJson(appName, body);
    }

    private IEnumerable<DiscoveryInstance> Active()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var pair in instances)
        {
            var instance = pair.Value;
            if ((now - instance.LastHeartbeatUtc).TotalSeconds <= instance.DurationInSecs) yield return instance;
            else instances.TryRemove(pair.Key, out _);
        }
    }

    private static DiscoveryInstance? FromXml(string appName, string body)
    {
        var instance = XElement.Parse(body).Descendants("instance").FirstOrDefault() ?? XElement.Parse(body);
        var id = Text(instance, "instanceId");
        if (string.IsNullOrWhiteSpace(id)) return null;
        return new DiscoveryInstance(appName, id, Text(instance, "hostName") ?? "localhost", Text(instance, "ipAddr"), Text(instance, "status") ?? "UP", Number(instance, "port") ?? 80, Number(instance, "securePort"), Number(instance, "leaseInfo/durationInSecs") ?? 90, DateTimeOffset.UtcNow, instance);
    }

    private static DiscoveryInstance? FromJson(string appName, string body)
    {
        using var document = JsonDocument.Parse(body);
        var root = document.RootElement.TryGetProperty("instance", out var nested) ? nested : document.RootElement;
        var id = StringValue(root, "instanceId");
        if (string.IsNullOrWhiteSpace(id)) return null;
        var port = root.TryGetProperty("port", out var portElement) && portElement.ValueKind == JsonValueKind.Object && portElement.TryGetProperty("$", out var portValue) ? portValue.GetInt32() : root.TryGetProperty("port", out portElement) && portElement.TryGetInt32(out var directPort) ? directPort : 80;
        return new DiscoveryInstance(appName, id, StringValue(root, "hostName") ?? "localhost", StringValue(root, "ipAddr"), StringValue(root, "status") ?? "UP", port, null, 90, DateTimeOffset.UtcNow, null);
    }

    private static string Key(string app, string instance) => $"{app}:{instance}";
    private static string? Text(XElement element, string path)
    {
        XElement? current = element;
        foreach (var name in path.Split('/')) current = current?.Element(name);
        return current?.Value;
    }
    private static int? Number(XElement element, string path) => int.TryParse(Text(element, path), out var value) ? value : null;
    private static string? StringValue(JsonElement element, string name) => element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}

public sealed record DiscoveryInstance(string App, string InstanceId, string HostName, string? IpAddress, string Status, int Port, int? SecurePort, int DurationInSecs, DateTimeOffset LastHeartbeatUtc, XElement? OriginalXml)
{
    public XElement ToXml() => OriginalXml is not null
        ? new XElement(OriginalXml)
        : new XElement("instance", new XElement("instanceId", InstanceId), new XElement("hostName", HostName), new XElement("app", App), new XElement("ipAddr", IpAddress ?? HostName), new XElement("status", Status), new XElement("port", new XAttribute("enabled", "true"), Port));
}

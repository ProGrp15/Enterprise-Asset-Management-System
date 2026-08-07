namespace AuthService.Models;

public class Department
{
    public long Id { get; set; }
    public long? CompanyId { get; set; }
    public Company? Company { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
}

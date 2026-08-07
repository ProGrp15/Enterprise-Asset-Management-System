namespace AuthService.Models;

public class User
{
    public long Id { get; set; }
    public long? CompanyId { get; set; }
    public Company? Company { get; set; }
    public long? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public long? RoleId { get; set; }
    public Role? Role { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
}

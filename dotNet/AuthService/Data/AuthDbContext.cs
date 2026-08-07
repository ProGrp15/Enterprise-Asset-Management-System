using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }

    public DbSet<Company> Companies { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Company>().ToTable("companies");
        modelBuilder.Entity<Company>().Property(c => c.Id).HasColumnName("company_id");
        modelBuilder.Entity<Company>().Property(c => c.Name).HasColumnName("company_name");
        modelBuilder.Entity<Company>().Property(c => c.Email).HasColumnName("company_email");
        modelBuilder.Entity<Company>().Property(c => c.Phone).HasColumnName("company_phone");
        modelBuilder.Entity<Company>().Property(c => c.OrganizationSize).HasColumnName("organization_size");
        modelBuilder.Entity<Company>().Property(c => c.PostalCode).HasColumnName("postal_code");
        modelBuilder.Entity<Company>().Property(c => c.Active).HasColumnName("is_active");

        modelBuilder.Entity<Role>().ToTable("roles");
        modelBuilder.Entity<Role>().Property(r => r.Id).HasColumnName("role_id");
        modelBuilder.Entity<Role>().Property(r => r.Name).HasColumnName("role_name");

        modelBuilder.Entity<Department>().ToTable("departments");
        modelBuilder.Entity<Department>().Property(d => d.Id).HasColumnName("department_id");
        modelBuilder.Entity<Department>().Property(d => d.CompanyId).HasColumnName("company_id");
        modelBuilder.Entity<Department>().Property(d => d.Name).HasColumnName("department_name");
        modelBuilder.Entity<Department>().Property(d => d.Active).HasColumnName("is_active");

        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<User>().Property(u => u.Id).HasColumnName("user_id");
        modelBuilder.Entity<User>().Property(u => u.CompanyId).HasColumnName("company_id");
        modelBuilder.Entity<User>().Property(u => u.DepartmentId).HasColumnName("department_id");
        modelBuilder.Entity<User>().Property(u => u.RoleId).HasColumnName("role_id");
        modelBuilder.Entity<User>().Property(u => u.FirstName).HasColumnName("first_name");
        modelBuilder.Entity<User>().Property(u => u.LastName).HasColumnName("last_name");
        modelBuilder.Entity<User>().Property(u => u.Active).HasColumnName("is_active");

        modelBuilder.Entity<PasswordResetToken>().ToTable("password_reset_tokens");
        modelBuilder.Entity<PasswordResetToken>().Property(p => p.Id).HasColumnName("token_id");
        modelBuilder.Entity<PasswordResetToken>().Property(p => p.UserId).HasColumnName("user_id");
        modelBuilder.Entity<PasswordResetToken>().Property(p => p.TokenHash).HasColumnName("token_hash");
        modelBuilder.Entity<PasswordResetToken>().Property(p => p.ExpiresAt).HasColumnName("expires_at");
        modelBuilder.Entity<PasswordResetToken>().Property(p => p.ConsumedAt).HasColumnName("consumed_at");
    }
}

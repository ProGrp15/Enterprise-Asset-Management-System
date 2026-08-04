using CompanyService.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Data
{
    public class CompanyDbContext : DbContext
    {
        public CompanyDbContext(DbContextOptions<CompanyDbContext> options) : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // In the Java app, user has a unique index on email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Department uniqueness
            modelBuilder.Entity<Department>()
                .HasIndex(d => new { d.CompanyId, d.DepartmentName })
                .IsUnique();

            // Location uniqueness
            modelBuilder.Entity<Location>()
                .HasIndex(l => new { l.CompanyId, l.LocationName })
                .IsUnique();
        }
    }
}

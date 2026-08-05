using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Assetflow.AuthService.Models
{
    [Table("companies")]
    public class Company
    {
        [Key]
        [Column("company_id")]
        public long Id { get; set; }

        [Column("company_name")]
        public string Name { get; set; }

        [Column("company_email")]
        public string Email { get; set; }

        [Column("company_phone")]
        public string Phone { get; set; }

        [Column("industry")]
        public string Industry { get; set; }

        [Column("organization_size")]
        public string OrganizationSize { get; set; }

        [Column("address")]
        public string Address { get; set; }

        [Column("city")]
        public string City { get; set; }

        [Column("state")]
        public string State { get; set; }

        [Column("country")]
        public string Country { get; set; }

        [Column("postal_code")]
        public string PostalCode { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }

    [Table("departments")]
    public class Department
    {
        [Key]
        [Column("department_id")]
        public long Id { get; set; }

        [Column("company_id")]
        public long CompanyId { get; set; }
        
        [ForeignKey("CompanyId")]
        public Company Company { get; set; }

        [Column("department_name")]
        public string Name { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }

    [Table("roles")]
    public class Role
    {
        [Key]
        [Column("role_id")]
        public long Id { get; set; }

        [Column("role_name")]
        public string Name { get; set; }

        [Column("description")]
        public string Description { get; set; }
    }

    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public long Id { get; set; }

        [Column("company_id")]
        public long? CompanyId { get; set; }
        [ForeignKey("CompanyId")]
        public Company Company { get; set; }

        [Column("department_id")]
        public long? DepartmentId { get; set; }
        [ForeignKey("DepartmentId")]
        public Department Department { get; set; }

        [Column("role_id")]
        public long RoleId { get; set; }
        [ForeignKey("RoleId")]
        public Role Role { get; set; }

        [Column("first_name")]
        public string FirstName { get; set; }

        [Column("last_name")]
        public string LastName { get; set; }

        [Column("email")]
        public string Email { get; set; }

        [Column("password")]
        public string Password { get; set; }

        [Column("phone")]
        public string Phone { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }

    [Table("password_reset_tokens")]
    public class PasswordResetToken
    {
        [Key]
        [Column("token_id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }

        [Column("token_hash")]
        public string TokenHash { get; set; }

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("consumed_at")]
        public DateTime? ConsumedAt { get; set; }
    }
}

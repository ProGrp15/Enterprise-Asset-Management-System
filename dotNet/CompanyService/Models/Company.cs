using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyService.Models
{
    [Table("companies")]
    public class Company
    {
        [Key]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("company_name")]
        [StringLength(150)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [Column("company_email")]
        [StringLength(120)]
        public string CompanyEmail { get; set; } = string.Empty;

        [Required]
        [Column("company_phone")]
        [StringLength(20)]
        public string CompanyPhone { get; set; } = string.Empty;

        [Required]
        [Column("industry")]
        [StringLength(100)]
        public string Industry { get; set; } = string.Empty;

        [Required]
        [Column("organization_size")]
        [StringLength(20)]
        public string OrganizationSize { get; set; } = string.Empty;

        [Required]
        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Column("city")]
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [Column("state")]
        [StringLength(100)]
        public string State { get; set; } = string.Empty;

        [Required]
        [Column("country")]
        [StringLength(100)]
        public string Country { get; set; } = string.Empty;

        [Required]
        [Column("postal_code")]
        [StringLength(15)]
        public string PostalCode { get; set; } = string.Empty;

        [Column("is_active")]
        public bool? IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}

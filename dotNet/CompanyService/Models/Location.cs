using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyService.Models
{
    [Table("locations")]
    public class Location
    {
        [Key]
        [Column("location_id")]
        public long LocationId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("location_name")]
        [StringLength(120)]
        public string LocationName { get; set; } = string.Empty;

        [Column("address")]
        public string? Address { get; set; }

        [Column("city")]
        [StringLength(100)]
        public string? City { get; set; }

        [Column("state")]
        [StringLength(100)]
        public string? State { get; set; }

        [Column("country")]
        [StringLength(100)]
        public string? Country { get; set; }

        [Column("postal_code")]
        [StringLength(15)]
        public string? PostalCode { get; set; }

        [Column("is_active")]
        public bool? IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CompanyId")]
        public Company? Company { get; set; }
    }
}

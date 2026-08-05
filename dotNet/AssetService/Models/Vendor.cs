using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("vendors")]
    public class Vendor
    {
        [Key]
        [Column("vendor_id")]
        public long VendorId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("vendor_name")]
        [StringLength(100)]
        public string VendorName { get; set; } = string.Empty;

        [Required]
        [Column("contact_person")]
        [StringLength(100)]
        public string ContactPerson { get; set; } = string.Empty;

        [Column("email")]
        [StringLength(120)]
        public string? Email { get; set; }

        [Required]
        [Column("phone")]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Column("address")]
        public string? Address { get; set; }

        [Column("is_active")]
        public bool? IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}

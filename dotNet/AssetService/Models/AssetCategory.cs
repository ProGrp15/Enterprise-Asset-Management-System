using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("asset_categories")]
    public class AssetCategory
    {
        [Key]
        [Column("category_id")]
        public long CategoryId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("category_name")]
        [StringLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [Column("description")]
        [StringLength(255)]
        public string? Description { get; set; }

        [Column("is_active")]
        public bool? IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}

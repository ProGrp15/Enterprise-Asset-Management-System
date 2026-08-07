using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("assets")]
    public class Asset
    {
        [Key]
        [Column("asset_id")]
        public long AssetId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("category_id")]
        public long CategoryId { get; set; }

        [Required]
        [Column("vendor_id")]
        public long VendorId { get; set; }

        [Column("location_id")]
        public long? LocationId { get; set; }

        [Column("purchase_order_id")]
        public long? PurchaseOrderId { get; set; }

        [Required]
        [Column("asset_name")]
        [StringLength(100)]
        public string AssetName { get; set; } = string.Empty;

        [Required]
        [Column("asset_tag")]
        [StringLength(50)]
        public string AssetTag { get; set; } = string.Empty;

        [Required]
        [Column("serial_number")]
        [StringLength(100)]
        public string SerialNumber { get; set; } = string.Empty;

        [Column("manufacturer")]
        [StringLength(100)]
        public string? Manufacturer { get; set; }

        [Column("model")]
        [StringLength(100)]
        public string? Model { get; set; }

        [Column("purchase_date")]
        public DateTime? PurchaseDate { get; set; }

        [Column("purchase_cost")]
        public decimal? PurchaseCost { get; set; }

        [Column("warranty_expiry")]
        public DateTime? WarrantyExpiry { get; set; }

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = string.Empty;

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("is_active")]
        public bool? IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CategoryId")]
        public AssetCategory? Category { get; set; }

        [ForeignKey("VendorId")]
        public Vendor? Vendor { get; set; }
    }
}

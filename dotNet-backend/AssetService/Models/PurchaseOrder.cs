using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("purchase_orders")]
    public class PurchaseOrder
    {
        [Key]
        [Column("purchase_order_id")]
        public long PurchaseOrderId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("vendor_id")]
        public long VendorId { get; set; }

        [Required]
        [Column("order_number")]
        [StringLength(80)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [Column("order_date")]
        public DateTime OrderDate { get; set; }

        [Column("expected_delivery_date")]
        public DateTime? ExpectedDeliveryDate { get; set; }

        [Required]
        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = string.Empty;

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("VendorId")]
        public Vendor? Vendor { get; set; }
    }
}

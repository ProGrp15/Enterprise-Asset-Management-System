using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("asset_transfers")]
    public class AssetTransfer
    {
        [Key]
        [Column("transfer_id")]
        public long TransferId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("asset_id")]
        public long AssetId { get; set; }

        [Column("from_employee_id")]
        public long? FromEmployeeId { get; set; }

        [Column("to_employee_id")]
        public long? ToEmployeeId { get; set; }

        [Column("from_location_id")]
        public long? FromLocationId { get; set; }

        [Column("to_location_id")]
        public long? ToLocationId { get; set; }

        [Column("requested_by")]
        public long? RequestedBy { get; set; }

        [Column("approved_by")]
        public long? ApprovedBy { get; set; }

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = "PENDING";

        [Column("reason")]
        [StringLength(500)]
        public string? Reason { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("asset_returns")]
    public class AssetReturn
    {
        [Key]
        [Column("return_id")]
        public long ReturnId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("asset_id")]
        public long AssetId { get; set; }

        [Required]
        [Column("employee_id")]
        public long EmployeeId { get; set; }

        [Column("requested_by")]
        public long? RequestedBy { get; set; }

        [Column("approved_by")]
        public long? ApprovedBy { get; set; }

        [Column("condition_status")]
        [StringLength(30)]
        public string? ConditionStatus { get; set; }

        [Column("remarks")]
        [StringLength(500)]
        public string? Remarks { get; set; }

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = "PENDING";

        [Column("returned_at")]
        public DateTime? ReturnedAt { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

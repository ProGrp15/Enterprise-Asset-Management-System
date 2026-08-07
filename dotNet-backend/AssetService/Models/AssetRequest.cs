using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("asset_requests")]
    public class AssetRequest
    {
        [Key]
        [Column("request_id")]
        public long RequestId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("employee_id")]
        public long EmployeeId { get; set; }

        [Column("category_id")]
        public long? CategoryId { get; set; }

        [Column("asset_id")]
        public long? AssetId { get; set; }

        [Column("approved_by")]
        public long? ApprovedBy { get; set; }

        [Required]
        [Column("request_type")]
        [StringLength(30)]
        public string RequestType { get; set; } = string.Empty;

        [Required]
        [Column("reason")]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = string.Empty;

        [Column("requested_at")]
        public DateTime? RequestedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CategoryId")]
        public AssetCategory? Category { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

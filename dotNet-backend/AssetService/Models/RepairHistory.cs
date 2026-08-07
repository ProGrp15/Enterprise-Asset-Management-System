using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("repair_history")]
    public class RepairHistory
    {
        [Key]
        [Column("repair_id")]
        public long RepairId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("asset_id")]
        public long AssetId { get; set; }

        [Column("technician_id")]
        public long? TechnicianId { get; set; }

        [Required]
        [Column("issue_description")]
        [StringLength(500)]
        public string IssueDescription { get; set; } = string.Empty;

        [Column("repair_action")]
        [StringLength(1000)]
        public string? RepairAction { get; set; }

        [Column("cost")]
        public decimal? Cost { get; set; }

        [Column("started_at")]
        public DateTime? StartedAt { get; set; }

        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = "OPEN";

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

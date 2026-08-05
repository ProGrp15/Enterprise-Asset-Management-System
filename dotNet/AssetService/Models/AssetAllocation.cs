using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("asset_allocations")]
    public class AssetAllocation
    {
        [Key]
        [Column("allocation_id")]
        public long AllocationId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("asset_id")]
        public long AssetId { get; set; }

        [Required]
        [Column("employee_id")]
        public long EmployeeId { get; set; }

        [Required]
        [Column("allocated_by")]
        public long AllocatedBy { get; set; }

        [Required]
        [Column("allocated_date")]
        public DateTime AllocatedDate { get; set; }

        [Column("expected_return_date")]
        public DateTime? ExpectedReturnDate { get; set; }

        [Column("returned_date")]
        public DateTime? ReturnedDate { get; set; }

        [Required]
        [Column("allocation_status")]
        [StringLength(30)]
        public string AllocationStatus { get; set; } = string.Empty;

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

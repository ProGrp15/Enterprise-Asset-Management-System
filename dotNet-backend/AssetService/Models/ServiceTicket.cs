using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("service_tickets")]
    public class ServiceTicket
    {
        [Key]
        [Column("ticket_id")]
        public long TicketId { get; set; }

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
        [Column("issue_description")]
        public string IssueDescription { get; set; } = string.Empty;

        [Required]
        [Column("priority")]
        [StringLength(20)]
        public string Priority { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(30)]
        public string Status { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }

        [ForeignKey("AssetId")]
        public Asset? Asset { get; set; }
    }
}

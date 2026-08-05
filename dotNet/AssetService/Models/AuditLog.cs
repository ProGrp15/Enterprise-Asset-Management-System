using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetService.Models
{
    [Table("audit_logs")]
    public class AuditLog
    {
        [Key]
        [Column("audit_id")]
        public long AuditId { get; set; }

        [Required]
        [Column("company_id")]
        public long CompanyId { get; set; }

        [Required]
        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [Column("module")]
        [StringLength(100)]
        public string Module { get; set; } = string.Empty;

        [Required]
        [Column("action")]
        [StringLength(255)]
        public string Action { get; set; } = string.Empty;

        [Column("entity_id")]
        public long? EntityId { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("ip_address")]
        [StringLength(45)]
        public string? IpAddress { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}

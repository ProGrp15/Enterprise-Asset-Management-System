using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyService.Models
{
    [Table("roles")]
    public class Role
    {
        [Key]
        [Column("role_id")]
        public long RoleId { get; set; }

        [Required]
        [Column("role_name")]
        [StringLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [Column("description")]
        [StringLength(255)]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}

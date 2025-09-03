using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GlowyAPI.Models
{
    public class Favorite
    {
        public int Id {  get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int JewelleryId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("JewelleryId")]
        public virtual Jewellery Jewellery { get; set; } = null!;
    }
}

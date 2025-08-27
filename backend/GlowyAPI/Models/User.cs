using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace GlowyAPI.Models
{
    [Index(nameof(Username), IsUnique = true)]
    [Index(nameof(Email), IsUnique = true)] 
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();
    }
}

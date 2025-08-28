using System.ComponentModel.DataAnnotations;

namespace GlowyAPI.Models
{
    public class Order
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int AddressId { get; set; }

        [Required]
        [MaxLength(20)]
        public string PaymentMethod { get; set; } = string.Empty; // "CreditCard", "PayPal", "BankTransfer"

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ShippedDate { get; set; }
        public DateTime? DeliveredDate { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Address Address { get; set; } = null!;
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
    public class OrderItem
    {
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int JewelleryId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public decimal Price { get; set; } // Price at time of order

        // Navigation properties
        public virtual Order Order { get; set; } = null!;
        public virtual Jewellery Jewellery { get; set; } = null!;
    }
}

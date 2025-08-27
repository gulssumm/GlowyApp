using Microsoft.EntityFrameworkCore;
using GlowyAPI.Models;

namespace GlowyAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<User> Users { get; set; }
        public DbSet<Jewellery> Jewelleries { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        public static void SeedJewelries(AppDbContext context)
        {
            if (!context.Jewelleries.Any())
            {
                var jewelries = new List<Jewellery>
        {
            new Jewellery
            {
                Name = "Diamond Ring",
                Description = "Beautiful diamond engagement ring",
                Price = 2500.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/diamond-ring.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Gold Necklace",
                Description = "Elegant gold necklace with pendant",
                Price = 850.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/emerald-necklace.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Diamond Ring",
                Description = "Beautiful diamond engagement ring",
                Price = 2500.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/diamond-tennis-bracelet.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Gold Necklace",
                Description = "Elegant gold necklace with pendant",
                Price = 850.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/engagement-ring.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Diamond Ring",
                Description = "Beautiful diamond engagement ring",
                Price = 2500.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/pearl-earrings.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Gold Necklace",
                Description = "Elegant gold necklace with pendant",
                Price = 850.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/rose-gold-bangle.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Diamond Ring",
                Description = "Beautiful diamond engagement ring",
                Price = 2500.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/ruby-bracelet.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Jewellery
            {
                Name = "Gold Necklace",
                Description = "Elegant gold necklace with pendant",
                Price = 850.00m,
                ImageUrl = "https://localhost:5000/images/jewelry/gold-earrings.jpg", // Local URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

                context.Jewelleries.AddRange(jewelries);
                context.SaveChanges();
            }
        }

        // Helper method to generate correct URLs dynamically
        public static string GetImageUrl(HttpRequest request, string fileName)
        {
            return $"{request.Scheme}://{request.Host}/images/jewelry/{fileName}";
        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Cart configuration
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany(u => u.Carts)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // CartItem configuration
            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Jewellery)
                .WithMany(j => j.CartItems)
                .HasForeignKey(ci => ci.JewelleryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Decimal precision for SQLite
            modelBuilder.Entity<Jewellery>()
                .Property(j => j.Price)
                .HasColumnType("decimal(18,2)");
        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlite("Data Source=glowyapp.db", options =>
                {
                    options.CommandTimeout(30);
                });
            }
        }
    }
}
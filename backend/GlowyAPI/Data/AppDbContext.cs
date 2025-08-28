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
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

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
                        ImageUrl = "diamond-ring.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Emerald Necklace",
                        Description = "Elegant emerald necklace with gold setting",
                        Price = 1850.00m,
                        ImageUrl = "emerald-necklace.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Diamond Tennis Bracelet",
                        Description = "Classic diamond tennis bracelet",
                        Price = 3200.00m,
                        ImageUrl = "diamond-tennis-bracelet.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Engagement Ring",
                        Description = "Stunning solitaire engagement ring",
                        Price = 4500.00m,
                        ImageUrl = "engagement-ring.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Pearl Earrings",
                        Description = "Classic white pearl drop earrings",
                        Price = 680.00m,
                        ImageUrl = "pearl-earrings.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Rose Gold Bangle",
                        Description = "Elegant rose gold bangle bracelet",
                        Price = 1200.00m,
                        ImageUrl = "rose-gold-bangle.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Ruby Bracelet",
                        Description = "Exquisite ruby and diamond bracelet",
                        Price = 2800.00m,
                        ImageUrl = "ruby-bracelet.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Jewellery
                    {
                        Name = "Gold Earrings",
                        Description = "Elegant gold hoop earrings",
                        Price = 950.00m,
                        ImageUrl = "gold-earrings.jpg", // Store only filename
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                context.Jewelleries.AddRange(jewelries);
                context.SaveChanges();
                Console.WriteLine($"Seeded {jewelries.Count} jewelry items with local image filenames");
            }
        }

        // Method to fix existing data with external URLs
        public static async Task FixExistingImageUrls(AppDbContext context)
        {
            var jewelries = await context.Jewelleries.ToListAsync();
            bool anyUpdated = false;

            foreach (var jewelry in jewelries)
            {
                // If it has an external URL or full local URL, extract filename
                if (jewelry.ImageUrl.Contains("http") || jewelry.ImageUrl.Contains("/"))
                {
                    // Extract filename from URL
                    var fileName = Path.GetFileName(jewelry.ImageUrl);

                    // If no proper filename found, create a generic one
                    if (string.IsNullOrEmpty(fileName) || !fileName.Contains("."))
                    {
                        fileName = $"jewelry-{jewelry.Id}.jpg";
                    }

                    jewelry.ImageUrl = fileName;
                    anyUpdated = true;
                    Console.WriteLine($"Updated jewelry ID {jewelry.Id}: {fileName}");
                }
            }

            if (anyUpdated)
            {
                await context.SaveChangesAsync();
                Console.WriteLine($"Fixed image URLs for existing jewelry items");
            }
            else
            {
                Console.WriteLine("No jewelry items needed URL fixes");
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

            // Address configuration
            modelBuilder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order configuration
            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Address)
                .WithMany()
                .HasForeignKey(o => o.AddressId)
                .OnDelete(DeleteBehavior.Restrict);

            // OrderItem configuration
            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Jewellery)
                .WithMany()
                .HasForeignKey(oi => oi.JewelleryId)
                .OnDelete(DeleteBehavior.Restrict);
        
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
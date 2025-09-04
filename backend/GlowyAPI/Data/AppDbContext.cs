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
        public DbSet<Favorite> Favorites { get; set; }
        public DbSet<Category> Categories { get; set; }

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

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IconName).HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Jewellery configuration
            modelBuilder.Entity<Jewellery>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CategoryId).IsRequired();

                // Jewellery-Category relationship
                entity.HasOne(j => j.Category)
                      .WithMany(c => c.Jewelleries)
                      .HasForeignKey(j => j.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

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

            // Favorite configuration
            modelBuilder.Entity<Favorite>()
                .HasIndex(f => new { f.UserId, f.JewelleryId })
                .IsUnique(); // Prevent duplicate favorites

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.User)
                .WithMany(u => u.Favorites)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.Jewellery)
                .WithMany(j => j.Favorites)
                .HasForeignKey(f => f.JewelleryId)
                .OnDelete(DeleteBehavior.Cascade);
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
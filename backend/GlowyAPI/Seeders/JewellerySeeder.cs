using Microsoft.EntityFrameworkCore;
using GlowyAPI.Data;
using GlowyAPI.Models;

namespace GlowyAPI.Seeders
{
    public static class JewellerySeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // Check if jewelries already exist
            if (await context.Jewelleries.AnyAsync())
            {
                Console.WriteLine("Jewelries already exist, skipping jewellery seeding");
                return;
            }

            // Get category IDs (categories must be seeded first)
            var categories = await context.Categories.ToListAsync();
            if (!categories.Any())
            {
                throw new InvalidOperationException("Categories must be seeded before jewelries. Please seed categories first.");
            }

            var ringsCategory = categories.First(c => c.Name == "Rings").Id;
            var necklacesCategory = categories.First(c => c.Name == "Necklaces").Id;
            var earringsCategory = categories.First(c => c.Name == "Earrings").Id;
            var braceletsCategory = categories.First(c => c.Name == "Bracelets").Id;

            var jewelries = new List<Jewellery>
            {
                // Rings
                new Jewellery
                {
                    Name = "Diamond Solitaire Ring",
                    Description = "Beautiful diamond engagement ring with classic solitaire setting",
                    Price = 2500.00m,
                    ImageUrl = "diamond-ring.jpg",
                    CategoryId = ringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Vintage Engagement Ring",
                    Description = "Stunning vintage-style engagement ring with intricate details",
                    Price = 4500.00m,
                    ImageUrl = "engagement-ring.jpg",
                    CategoryId = ringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Rose Gold Wedding Band",
                    Description = "Elegant rose gold wedding band with subtle sparkle",
                    Price = 850.00m,
                    ImageUrl = "rose-gold-ring.jpg",
                    CategoryId = ringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Necklaces
                new Jewellery
                {
                    Name = "Emerald Pendant Necklace",
                    Description = "Elegant emerald necklace with gold setting and delicate chain",
                    Price = 1850.00m,
                    ImageUrl = "emerald-necklace.jpg",
                    CategoryId = necklacesCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Diamond Tennis Necklace",
                    Description = "Luxurious diamond tennis necklace perfect for special occasions",
                    Price = 3800.00m,
                    ImageUrl = "diamond-necklace.jpg",
                    CategoryId = necklacesCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Pearl Strand Necklace",
                    Description = "Classic cultured pearl necklace with sterling silver clasp",
                    Price = 1200.00m,
                    ImageUrl = "pearl-necklace.jpg",
                    CategoryId = necklacesCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Earrings
                new Jewellery
                {
                    Name = "Pearl Drop Earrings",
                    Description = "Classic white pearl drop earrings with gold accents",
                    Price = 680.00m,
                    ImageUrl = "pearl-earrings.jpg",
                    CategoryId = earringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Diamond Stud Earrings",
                    Description = "Brilliant diamond stud earrings in platinum setting",
                    Price = 1500.00m,
                    ImageUrl = "diamond-studs.jpg",
                    CategoryId = earringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Gold Hoop Earrings",
                    Description = "Elegant 14k gold hoop earrings with modern twist design",
                    Price = 950.00m,
                    ImageUrl = "gold-earrings.jpg",
                    CategoryId = earringsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Bracelets
                new Jewellery
                {
                    Name = "Diamond Tennis Bracelet",
                    Description = "Classic diamond tennis bracelet with secure clasp",
                    Price = 3200.00m,
                    ImageUrl = "diamond-tennis-bracelet.jpg",
                    CategoryId = braceletsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Rose Gold Charm Bracelet",
                    Description = "Elegant rose gold bracelet with customizable charm options",
                    Price = 1200.00m,
                    ImageUrl = "rose-gold-bangle.jpg",
                    CategoryId = braceletsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Ruby Tennis Bracelet",
                    Description = "Exquisite ruby and diamond bracelet in white gold setting",
                    Price = 2800.00m,
                    ImageUrl = "ruby-bracelet.jpg",
                    CategoryId = braceletsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Jewellery
                {
                    Name = "Silver Chain Bracelet",
                    Description = "Delicate sterling silver chain bracelet with adjustable length",
                    Price = 320.00m,
                    ImageUrl = "silver-bracelet.jpg",
                    CategoryId = braceletsCategory,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            try
            {
                await context.Jewelleries.AddRangeAsync(jewelries);
                await context.SaveChangesAsync();
                Console.WriteLine($"Successfully seeded {jewelries.Count} jewelry items with categories");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding jewelries: {ex.Message}");
                throw;
            }
        }
    }
}
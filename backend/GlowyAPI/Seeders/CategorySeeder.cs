using GlowyAPI.Data;
using GlowyAPI.Models;

namespace GlowyAPI.Seeders
{
    public static class CategorySeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // Check if categories already exist
            if (context.Categories.Any())
            {
                Console.WriteLine("Categories already exist, skipping category seeding");
                return;
            }

            var categories = new List<Category>
            {
                new Category
                {
                    Name = "Rings",
                    Description = "Beautiful rings for every occasion - engagement, wedding, fashion, and more",
                    IconName = "diamond-outline",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Necklaces",
                    Description = "Elegant necklaces and pendants to complement any outfit",
                    IconName = "ellipse-outline",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Earrings",
                    Description = "Stunning earrings from subtle studs to statement pieces",
                    IconName = "radio-outline",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Bracelets",
                    Description = "Stylish bracelets and bangles for every wrist",
                    IconName = "remove-outline",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            try
            {
                await context.Categories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
                Console.WriteLine($"Successfully seeded {categories.Count} categories");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding categories: {ex.Message}");
                throw;
            }
        }
    }
}
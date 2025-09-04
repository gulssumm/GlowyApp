using GlowyAPI.Data;
using GlowyAPI.Models;

namespace GlowyAPI.Seeders
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAllAsync(AppDbContext context)
        {
            try
            {
                Console.WriteLine("Starting database seeding...");

                // Ensure database exists
                await context.Database.EnsureCreatedAsync();

                // Seed users first, as other tables depend on a valid user
                await UserSeeder.SeedAsync(context);

                // Seed categories
                await CategorySeeder.SeedAsync(context);

                // Seed jewelries
                await JewellerySeeder.SeedAsync(context);

                Console.WriteLine("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during database seeding: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}
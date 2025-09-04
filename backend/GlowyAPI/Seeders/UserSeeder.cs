using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace GlowyAPI.Seeders
{
    public static class UserSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.Users.AnyAsync())
            {
                Console.WriteLine("Users already exist, skipping user seeding");
                return;
            }

            Console.WriteLine("Seeding Users...");

            var users = new List<User>
            {
                new User
                {
                    Id = 1, // Explicitly set ID for testing
                    Username = "testuser",
                    Email = "test@example.com",
                    // Hash the password for security
                    Password = BCrypt.Net.BCrypt.HashPassword("123456")
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
            Console.WriteLine("User seeding completed.");
        }
    }
}
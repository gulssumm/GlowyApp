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
    }
}

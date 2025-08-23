using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=glowyapp.db")); // SQLite database file
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Create database if it does not exist
    db.Database.EnsureCreated();

    if (!db.Jewelleries.Any())
    {
        db.Jewelleries.AddRange(
            new Jewellery { Name = "Gold Ring", Description = "18K Gold Ring", Price = 1200, ImageUrl = "https://..." },
            new Jewellery { Name = "Silver Necklace", Description = "Silver Pendant", Price = 450, ImageUrl = "https://..." }
        );
        db.SaveChanges();
    }

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "123456" //TODO: hash passwords
        });
        db.SaveChanges();
    }
}

// App configuration - moved outside the scope
// app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
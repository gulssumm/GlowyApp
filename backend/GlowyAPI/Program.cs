using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=glowyapp.db"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]))
        };
    });

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
        var testUser = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("123456")
        };

        db.Users.Add(testUser);
        db.SaveChanges();
    }
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
using GlowyAPI.Data;
using GlowyAPI.Models;
using GlowyAPI.Seeders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Disable automatic claim mapping BEFORE any JWT configuration
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Add Swagger with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "GlowyAPI", Version = "v1" });

    // JWT Authentication for Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your JWT token.\n\nExample: Bearer eyJhbGciOiJIUzI1NiIsInR..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Add Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=glowyapp.db"));

// Configure JWT Settings with enhanced debugging
var jwtSettingsSection = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSettingsSection);
var jwtSettings = jwtSettingsSection.Get<JwtSettings>();

Console.WriteLine("=== JWT CONFIGURATION DEBUG ===");
Console.WriteLine($"SecretKey length: {jwtSettings?.SecretKey?.Length ?? 0}");
Console.WriteLine($"Issuer: {jwtSettings?.Issuer}");
Console.WriteLine($"Audience: {jwtSettings?.Audience}");
Console.WriteLine($"ExpirationDays: {jwtSettings?.ExpirationDays}");

if (string.IsNullOrEmpty(jwtSettings?.SecretKey))
{
    throw new InvalidOperationException("JWT SecretKey is not configured in appsettings.json");
}

builder.Services.AddScoped<JwtService>();

// Add JWT Authentication with comprehensive debugging
var secretKey = Encoding.UTF8.GetBytes(jwtSettings.SecretKey.Trim());
Console.WriteLine($"Secret key bytes length: {secretKey.Length}");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Allow HTTP in development
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),
            ClockSkew = TimeSpan.Zero,
            // These are critical for preserving original claim names
            NameClaimType = "name",
            RoleClaimType = "role"
        };

        // Comprehensive JWT authentication event logging
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                Console.WriteLine("=== JWT MESSAGE RECEIVED ===");
                var token = context.Token;
                if (!string.IsNullOrEmpty(token))
                {
                    Console.WriteLine($"Token received: {token.Substring(0, Math.Min(50, token.Length))}...");
                    Console.WriteLine($"Token length: {token.Length}");
                }
                else
                {
                    Console.WriteLine("No token received");
                }
                Console.WriteLine($"Request path: {context.Request.Path}");
                Console.WriteLine($"Request method: {context.Request.Method}");

                // Check Authorization header
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                Console.WriteLine($"Authorization header: {authHeader?.Substring(0, Math.Min(50, authHeader?.Length ?? 0))}...");

                return Task.CompletedTask;
            },

            OnTokenValidated = context =>
            {
                Console.WriteLine("=== JWT TOKEN VALIDATED SUCCESSFULLY ===");
                Console.WriteLine($"User identity name: {context.Principal?.Identity?.Name}");
                Console.WriteLine($"User identity authenticated: {context.Principal?.Identity?.IsAuthenticated}");
                Console.WriteLine($"User identity authentication type: {context.Principal?.Identity?.AuthenticationType}");

                var claims = context.Principal?.Claims?.Select(c => $"{c.Type}={c.Value}") ?? new List<string>();
                Console.WriteLine($"All claims ({claims.Count()}): {string.Join(", ", claims)}");

                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("=== JWT AUTHENTICATION FAILED ===");
                Console.WriteLine($"Exception: {context.Exception?.GetType().Name}");
                Console.WriteLine($"Message: {context.Exception?.Message}");
                Console.WriteLine($"Inner exception: {context.Exception?.InnerException?.Message}");

                // Don't log full stack trace in production
                if (builder.Environment.IsDevelopment())
                {
                    Console.WriteLine($"Stack trace: {context.Exception?.StackTrace}");
                }

                // Check what we received
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                Console.WriteLine($"Authorization header was: {authHeader?.Substring(0, Math.Min(50, authHeader?.Length ?? 0))}...");

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine("=== JWT CHALLENGE ===");
                Console.WriteLine($"Error: {context.Error}");
                Console.WriteLine($"Error description: {context.ErrorDescription}");
                Console.WriteLine($"Error URI: {context.ErrorUri}");

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Static files MUST come before CORS and Authentication
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images")),
    RequestPath = "/images"
});

app.UseRouting();
app.UseCors("AllowAll");

// Custom middleware to log all requests
app.Use(async (context, next) =>
{
    Console.WriteLine($"=== REQUEST: {context.Request.Method} {context.Request.Path} ===");
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (!string.IsNullOrEmpty(authHeader))
    {
        Console.WriteLine($"Auth header present: {authHeader.Substring(0, Math.Min(20, authHeader.Length))}...");
    }
    else
    {
        Console.WriteLine("No Authorization header");
    }

    await next();

    Console.WriteLine($"=== RESPONSE: {context.Response.StatusCode} ===");
});

// This order is critical
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Console.WriteLine("=== SERVER STARTING ===");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");

// Database setup and seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Show all table names in console
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM sqlite_master WHERE type='table';";
        var reader = await command.ExecuteReaderAsync();

        Console.WriteLine("=== TABLES IN DATABASE ===");
        while (await reader.ReadAsync())
        {
            Console.WriteLine($"Table: {reader["name"]}");
        }
        await reader.CloseAsync();
        await connection.CloseAsync();

        // Seed all data using DatabaseSeeder
        await DatabaseSeeder.SeedAllAsync(context);

        Console.WriteLine("=== DATABASE SEEDING COMPLETED ===");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"=== DATABASE SETUP/SEEDING FAILED: {ex.Message} ===");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

// Log static files info
var webRootPath = app.Environment.WebRootPath;
Console.WriteLine($"=== STATIC FILES INFO ===");
Console.WriteLine($"WebRootPath: {webRootPath}");
Console.WriteLine($"Static files will be served from: {webRootPath}");

if (Directory.Exists(Path.Combine(webRootPath ?? "", "images", "jewelry")))
{
    var imageFiles = Directory.GetFiles(Path.Combine(webRootPath, "images", "jewelry"));
    Console.WriteLine($"Found {imageFiles.Length} image files in jewelry folder");
    foreach (var file in imageFiles.Take(10)) // Show only first 10 files
    {
        Console.WriteLine($"  - {Path.GetFileName(file)}");
    }
    if (imageFiles.Length > 10)
    {
        Console.WriteLine($"  ... and {imageFiles.Length - 10} more files");
    }
}
else
{
    Console.WriteLine("WARNING: images/jewelry folder not found!");
}

app.Run();
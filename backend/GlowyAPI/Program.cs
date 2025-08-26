using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CRITICAL: Disable automatic claim mapping BEFORE any JWT configuration
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
app.UseRouting();
app.UseCors("AllowAll");

// Add custom middleware to log all requests
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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Check how many items exist
    if (db.Jewelleries.Count() < 6)
    {
        db.Jewelleries.AddRange(
            new Jewellery { Name = "Diamond Solitaire Ring", Description = "18K White Gold Diamond Ring", Price = 2500, ImageUrl = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center" },
            new Jewellery { Name = "Pearl Necklace", Description = "Classic Freshwater Pearl Necklace", Price = 450, ImageUrl = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center" },
            new Jewellery { Name = "Gold Earrings", Description = "14K Gold Drop Earrings", Price = 680, ImageUrl = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&crop=center" },
            new Jewellery { Name = "Silver Bracelet", Description = "Sterling Silver Chain Bracelet", Price = 180, ImageUrl = "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&crop=center" },
            new Jewellery { Name = "Ruby Ring", Description = "18K Gold Ruby Engagement Ring", Price = 3200, ImageUrl = "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&crop=center" },
            new Jewellery { Name = "Diamond Necklace", Description = "White Gold Diamond Tennis Necklace", Price = 1850, ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center" }
        );

        db.SaveChanges();
        Console.WriteLine("Seeded jewellery data!");
    }
}

app.Run();
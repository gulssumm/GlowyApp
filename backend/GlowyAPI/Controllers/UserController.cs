using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserController> _logger;
        private readonly JwtService _jwtService;

        public UserController(AppDbContext context, ILogger<UserController> logger, JwtService jwtService)
        {
            _context = context;
            _logger = logger;
            _jwtService = jwtService;
        }

        // Helper method to get current user ID from JWT
        private int? GetCurrentUserId()
        {
            // JWT standard claims mapping:
            // ClaimTypes.NameIdentifier maps to "nameid" in JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Log for debugging
            _logger.LogInformation("JWT Claims: {Claims}",
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogWarning("No NameIdentifier claim found in JWT");
                return null;
            }

            if (int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogInformation("Current user ID from JWT: {UserId}", userId);
                return userId;
            }

            _logger.LogWarning("Could not parse user ID: {UserIdClaim}", userIdClaim);
            return null;
        }

        // POST: api/users/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            // Manual validation
            if (string.IsNullOrWhiteSpace(user.Username) ||
                string.IsNullOrWhiteSpace(user.Email) ||
                string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest("All fields are required.");
            }

            var existingUsers = await _context.Users
                .Where(u => u.Username == user.Username || u.Email == user.Email)
                .ToListAsync();

            bool usernameTaken = existingUsers.Any(u => u.Username == user.Username);
            bool emailTaken = existingUsers.Any(u => u.Email == user.Email);

            _logger.LogInformation("Debug Register - usernameTaken: {UsernameTaken}, emailTaken: {EmailTaken}",
                        usernameTaken, emailTaken);

            if (usernameTaken && emailTaken)
                return Conflict("Username and Email are already taken.");
            else if (usernameTaken)
                return Conflict("Username already taken.");
            else if (emailTaken)
                return Conflict("Email already registered.");

            try
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return Ok(new { user.Id, user.Username, user.Email });
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true)
            {
                return Conflict("Username or Email already taken.");
            }
        }

        // POST: api/users/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest login)
        {
            if (string.IsNullOrWhiteSpace(login.Email) || string.IsNullOrWhiteSpace(login.Password))
            {
                return Unauthorized("Invalid email or password");
            }

            if (!login.Email.Contains("@"))
            {
                return Unauthorized("Invalid email or password");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == login.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.Password))
                return Unauthorized("Invalid email or password");

            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                Token = token,
                User = new { user.Id, user.Username, user.Email }
            });
        }

        // POST: api/user/change-password
        [HttpPost("change-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.OldPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("All fields are required.");
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters long.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password))
                return Unauthorized("Invalid email or current password.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Password changed successfully for user: {Email}", request.Email);
                return Ok(new { message = "Password changed successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user: {Email}", request.Email);
                return StatusCode(500, "An error occurred while changing password.");
            }
        }

        // GET: api/users - This should be protected in production
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetUser(int id)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized("Invalid token - no user ID found");
            }

            // Users can only access their own profile
            if (currentUserId != id)
            {
                return Forbid("You can only access your own profile");
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found");

            return Ok(new { user.Id, user.Username, user.Email });
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            // Debug logging - add this at the very top
            Console.WriteLine("=== UpdateUser DEBUG ===");
            Console.WriteLine($"Request received for user ID: {id}");
            Console.WriteLine($"Authorization header: {Request.Headers.Authorization}");
            Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"User.Identity.Name: {User.Identity?.Name}");
            Console.WriteLine($"All headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");

            if (User.Claims.Any())
            {
                Console.WriteLine($"Claims found: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
            }
            else
            {
                Console.WriteLine("No claims found in User object");
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                Console.WriteLine("GetCurrentUserId returned null");
                return Unauthorized("Invalid token - no user ID found");
            }

            Console.WriteLine($"Current user ID from JWT: {currentUserId}, Target ID: {id}");

            // Users can only update their own profile
            if (currentUserId != id)
            {
                return Forbid("You can only update your own profile");
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found");

            // Check if username/email are taken by others
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id != id && (u.Username == request.Username || u.Email == request.Email));

            if (existingUser != null)
                return Conflict("Username or Email already taken by another user");

            user.Username = request.Username;
            user.Email = request.Email;

            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Username, user.Email });
        }
        [HttpGet("test-auth")]
        [Authorize]
        public IActionResult TestAuth()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            return Ok(new
            {
                UserId = userId,
                Claims = claims,
                IsAuthenticated = User.Identity.IsAuthenticated
            });
        }
    }
}

public class ChangePasswordRequest
{
    public string Email { get; set; }
    public string OldPassword { get; set; }
    public string NewPassword { get; set; }
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    public string Password { get; set; }
}

public class UpdateUserRequest
{
    public string Username { get; set; }
    public string Email { get; set; }
}
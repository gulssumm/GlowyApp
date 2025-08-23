using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlowyAPI.Data;
using GlowyAPI.Models;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(AppDbContext context, ILogger<UserController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/users/register
        [HttpPost("register")]
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

            // TODO: hash passwords
            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return Ok(user);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true)
            {
                return Conflict("Username or Email already taken.");
            }

        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User login)
        {
            // Basic validation to avoid model validation errors
            if (string.IsNullOrWhiteSpace(login.Email) || string.IsNullOrWhiteSpace(login.Password))
            {
                return Unauthorized("Invalid email or password");
            }

            // Basic email format check to avoid validation errors
            if (!login.Email.Contains("@"))
            {
                return Unauthorized("Invalid email or password");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == login.Email && u.Password == login.Password);

            if (user == null) return Unauthorized("Invalid email or password");
            return Ok(user);
        }

        // POST: api/user/change-password
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.OldPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("All fields are required.");
            }

            // Validate new password length
            if (request.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters long.");
            }

            // Find user by email and old password
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.Password == request.OldPassword);

            if (user == null)
            {
                return Unauthorized("Invalid email or current password.");
            }

            // Update password
            user.Password = request.NewPassword; // TODO: hash passwords in production

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

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }
    }
}

public class ChangePasswordRequest
{
    public string Email { get; set; }
    public string OldPassword { get; set; }
    public string NewPassword { get; set; }
}

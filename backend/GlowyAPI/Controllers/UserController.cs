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

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }
    }
}

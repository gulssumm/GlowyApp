using BCrypt.Net;
using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;

        public UserController(AppDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        private int GetCurrentUserId()
        {
            // Log all available claims for debugging
            var allClaims = User.Claims.Select(c => $"{c.Type}: {c.Value}").ToList();
            Console.WriteLine($"=== EXTRACTING USER ID FROM CLAIMS ===");
            Console.WriteLine($"Total claims: {allClaims.Count}");
            Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
            Console.WriteLine($"User.Identity.AuthenticationType: {User.Identity?.AuthenticationType}");

            foreach (var claim in allClaims)
            {
                Console.WriteLine($"  {claim}");
            }

            // Try multiple possible claim types for user ID in order of preference
            // Handle both old and new token formats
            var userIdClaim = User.FindFirst("user_id")?.Value                   // Custom claim 
                             ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value  // Standard JWT subject 
                             ?? User.FindFirst("sub")?.Value                       // Alternative sub format
                             ?? User.FindFirst("nameid")?.Value                   // Nameid
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value  // .NET standard claim
                             ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value; // Full URI format (old token)

            Console.WriteLine($"Found user ID claim: '{userIdClaim}' from available claims");

            if (string.IsNullOrEmpty(userIdClaim))
            {
                Console.WriteLine("ERROR: No user ID claim found in any expected format");
                var claimsInfo = string.Join(", ", allClaims);
                throw new UnauthorizedAccessException($"No user ID found in token claims. Available claims: {claimsInfo}");
            }

            if (!int.TryParse(userIdClaim, out int currentUserId))
            {
                Console.WriteLine($"ERROR: Could not parse user ID '{userIdClaim}' to integer");
                throw new UnauthorizedAccessException($"Invalid user ID format in token: '{userIdClaim}'");
            }

            Console.WriteLine($"Successfully extracted user ID: {currentUserId}");
            return currentUserId;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
                return BadRequest(new { message = "Username or email already exists." });

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _jwtService.GenerateToken(user);
            return Ok(new
            {
                token = token,
                user = new { user.Id, user.Username, user.Email }
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return Unauthorized(new { message = "Invalid email or password" });

            var token = _jwtService.GenerateToken(user);
            return Ok(new
            {
                token = token,
                user = new { user.Id, user.Username, user.Email }
            });
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                Console.WriteLine($"=== GET USER REQUEST FOR ID: {id} ===");
                var currentUserId = GetCurrentUserId();
                Console.WriteLine($"Current user ID from token: {currentUserId}");

                if (currentUserId != id)
                    return Forbid("You can only access your own profile");

                var user = await _context.Users.FindAsync(id);
                if (user == null) return NotFound(new { message = "User not found" });

                return Ok(new { user.Id, user.Username, user.Email });
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"Unauthorized access in GetUser: {ex.Message}");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error in GetUser: {ex}");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                Console.WriteLine($"=== UPDATE USER REQUEST FOR ID: {id} ===");
                Console.WriteLine($"Request data: Username='{request.Username}', Email='{request.Email}'");

                var currentUserId = GetCurrentUserId();
                Console.WriteLine($"Current user ID from token: {currentUserId}");

                if (currentUserId != id)
                {
                    Console.WriteLine($"Access denied: Current user {currentUserId} trying to update user {id}");
                    return Forbid("You can only update your own profile");
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    Console.WriteLine($"User with ID {id} not found");
                    return NotFound(new { message = "User not found" });
                }

                Console.WriteLine($"Found user: ID={user.Id}, Username='{user.Username}', Email='{user.Email}'");

                // Check for username/email duplicates (excluding current user)
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id != id && (u.Username == request.Username || u.Email == request.Email));

                if (existingUser != null)
                {
                    Console.WriteLine($"Conflict: Username or Email already taken by user ID {existingUser.Id}");
                    return Conflict(new { message = "Username or Email already taken by another user" });
                }

                // Update user fields
                Console.WriteLine($"Updating user: '{user.Username}' -> '{request.Username}', '{user.Email}' -> '{request.Email}'");
                user.Username = request.Username;
                user.Email = request.Email;

                await _context.SaveChangesAsync();
                Console.WriteLine("User updated successfully in database");

                var result = new { user.Id, user.Username, user.Email };
                Console.WriteLine($"Returning updated user data: {System.Text.Json.JsonSerializer.Serialize(result)}");

                return Ok(new { user = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"Unauthorized access in UpdateUser: {ex.Message}");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error in UpdateUser: {ex}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("debug-claims")]
        [Authorize]
        public IActionResult DebugClaims()
        {
            try
            {
                Console.WriteLine("=== DEBUG CLAIMS ENDPOINT CALLED ===");

                var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var subjectClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                var customUserId = User.FindFirst("user_id")?.Value;

                Console.WriteLine($"Total claims found: {claims.Count}");
                foreach (var claim in claims)
                {
                    Console.WriteLine($"  {claim.Type} = {claim.Value}");
                }

                var currentUserId = GetCurrentUserId(); // This will also log details

                return Ok(new
                {
                    AllClaims = claims,
                    NameIdentifier = nameIdentifier,
                    SubjectClaim = subjectClaim,
                    CustomUserId = customUserId,
                    ExtractedUserId = currentUserId,
                    IsAuthenticated = User.Identity?.IsAuthenticated,
                    AuthenticationType = User.Identity?.AuthenticationType,
                    Identity = User.Identity?.Name
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in debug-claims: {ex}");
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpPost("change-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                Console.WriteLine($"=== CHANGE PASSWORD REQUEST ===");
                Console.WriteLine($"Email: {request.Email}");

                // Find user by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    Console.WriteLine("User not found");
                    return BadRequest(new { message = "Invalid email or current password" });
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password))
                {
                    Console.WriteLine("Current password verification failed");
                    return BadRequest(new { message = "Invalid email or current password" });
                }

                // Update password
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                Console.WriteLine("Password changed successfully");
                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error changing password: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
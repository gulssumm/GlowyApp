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

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/users/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            // In production: hash passwords
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User login)
        {
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

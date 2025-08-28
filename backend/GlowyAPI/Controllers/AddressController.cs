using Microsoft.AspNetCore.Mvc;
using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AddressController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("user_id")?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }

            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserAddresses()
        {
            try
            {
                var userId = GetCurrentUserId();
                var addresses = await _context.Addresses
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.IsDefault)
                    .ThenByDescending(a => a.CreatedAt)
                    .ToListAsync();

                return Ok(addresses);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting addresses: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                // If this is being set as default, unset other defaults
                if (request.IsDefault)
                {
                    var existingDefaults = await _context.Addresses
                        .Where(a => a.UserId == userId && a.IsDefault)
                        .ToListAsync();

                    foreach (var addr in existingDefaults)
                    {
                        addr.IsDefault = false;
                    }
                }

                var address = new Address
                {
                    UserId = userId,
                    Street = request.Street,
                    City = request.City,
                    State = request.State,
                    PostalCode = request.PostalCode,
                    Country = request.Country,
                    IsDefault = request.IsDefault,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Address created successfully", address });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating address: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{addressId}")]
        public async Task<IActionResult> UpdateAddress(int addressId, [FromBody] CreateAddressRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

                if (address == null)
                {
                    return NotFound(new { message = "Address not found" });
                }

                // If this is being set as default, unset other defaults
                if (request.IsDefault && !address.IsDefault)
                {
                    var existingDefaults = await _context.Addresses
                        .Where(a => a.UserId == userId && a.IsDefault && a.Id != addressId)
                        .ToListAsync();

                    foreach (var addr in existingDefaults)
                    {
                        addr.IsDefault = false;
                    }
                }

                address.Street = request.Street;
                address.City = request.City;
                address.State = request.State;
                address.PostalCode = request.PostalCode;
                address.Country = request.Country;
                address.IsDefault = request.IsDefault;
                address.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Address updated successfully", address });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating address: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{addressId}")]
        public async Task<IActionResult> DeleteAddress(int addressId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

                if (address == null)
                {
                    return NotFound(new { message = "Address not found" });
                }

                _context.Addresses.Remove(address);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Address deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting address: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        public class CreateAddressRequest
        {
            public string Street { get; set; } = string.Empty;
            public string City { get; set; } = string.Empty;
            public string State { get; set; } = string.Empty;
            public string PostalCode { get; set; } = string.Empty;
            public string Country { get; set; } = string.Empty;
            public bool IsDefault { get; set; } = false;
        }
    }
}
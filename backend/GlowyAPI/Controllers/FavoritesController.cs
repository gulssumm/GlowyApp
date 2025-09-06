using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlowyAPI.Data;
using GlowyAPI.Models;
using GlowyAPI.Helpers;
using System.Security.Claims;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FavoritesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserFavorites()
        {
            try
            {
                var userId = GetCurrentUserId();
                var favorites = await _context.Favorites
                    .Include(f => f.Jewellery)
                    .Where(f => f.UserId == userId)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

                foreach (var favorite in favorites)
                {
                    if (favorite.Jewellery != null)
                    {
                        favorite.Jewellery.ImageUrl = ImageUrlHelper.ProcessImageUrl(favorite.Jewellery.ImageUrl, Request);
                    }
                }

                var result = favorites.Select(f => new
                {
                    id = f.Id,
                    createdAt = f.CreatedAt,
                    jewellery = new
                    {
                        id = f.Jewellery.Id,
                        name = f.Jewellery.Name,
                        description = f.Jewellery.Description,
                        price = f.Jewellery.Price,
                        imageUrl = f.Jewellery.ImageUrl
                    }
                });
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving favorites.", details = ex.Message });
            }
        }

        [HttpPost("{jewelleryId}")]
        public async Task<IActionResult> AddToFavorites(int jewelleryId)
        {
            try
            {
                var userId = GetCurrentUserId();

                // === FIX: Add a user existence check to prevent foreign key errors ===
                var userExists = await _context.Users.FindAsync(userId);
                if (userExists == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Check if jewelry exists
                var jewellery = await _context.Jewelleries.FindAsync(jewelleryId);
                if (jewellery == null)
                {
                    return NotFound(new { message = "Jewellery not found." });
                }

                // Check if item is already in favorites
                var existingFavorite = await _context.Favorites
                                             .FirstOrDefaultAsync(f => f.UserId == userId && f.JewelleryId == jewelleryId);

                if (existingFavorite != null)
                {
                    return Conflict(new { message = "Item already in favorites." });
                }

                var favorite = new Favorite
                {
                    UserId = userId,
                    JewelleryId = jewelleryId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item added to favorites successfully.", isFavorited = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding to favorites: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpDelete("{jewelleryId}")]
        public async Task<IActionResult> RemoveFromFavorites(int jewelleryId)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Check if item is in favorites
                var existingFavorite = await _context.Favorites
                                             .FirstOrDefaultAsync(f => f.UserId == userId && f.JewelleryId == jewelleryId);

                if (existingFavorite == null)
                {
                    return NotFound(new { message = "Item not found in favorites." });
                }

                _context.Favorites.Remove(existingFavorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item removed from favorites successfully.", isFavorited = false });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing from favorites: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        [HttpGet("status/{jewelleryId}")]
        public async Task<IActionResult> GetFavoriteStatus(int jewelleryId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var isFavorited = await _context.Favorites.AnyAsync(f => f.UserId == userId && f.JewelleryId == jewelleryId);
                return Ok(new { isFavorited });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFavoriteStatus: {ex.Message}");
                return StatusCode(500, new { message = "Error checking favorite status" });
            }
        }

        [HttpPost("batch-status")]
        public async Task<IActionResult> GetBatchFavoriteStatus([FromBody] List<int> jewelleryIds)
        {
            try
            {
                var userId = GetCurrentUserId();
                var favorites = await _context.Favorites
                    .Where(f => f.UserId == userId && jewelleryIds.Contains(f.JewelleryId))
                    .Select(f => f.JewelleryId)
                    .ToListAsync();
                var result = jewelleryIds.ToDictionary(id => id, id => favorites.Contains(id));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetBatchFavoriteStatus: {ex.Message}");
                return StatusCode(500, new { message = "Error checking favorite statuses" });
            }
        }
    }
}
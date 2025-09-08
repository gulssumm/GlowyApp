using Microsoft.AspNetCore.Mvc;
using GlowyAPI.Data;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using GlowyAPI.Helpers;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
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

        private async Task<Cart> GetOrCreateUserCart(int userId)
        {
            // Add a user existence check to prevent foreign key errors
            var userExists = await _context.Users.FindAsync(userId);
            if (userExists == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found.");
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Jewellery)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetCurrentUserId();
                var cart = await GetOrCreateUserCart(userId);

                var cartResponse = new
                {
                    Id = cart.Id,
                    Items = cart.CartItems.Select(ci => new
                    {
                        Id = ci.Id,
                        JewelleryId = ci.JewelleryId,
                        Name = ci.Jewellery.Name,
                        Description = ci.Jewellery.Description,
                        Price = ci.Jewellery.Price,
                        ImageUrl = ImageUrlHelper.ProcessImageUrl(ci.Jewellery.ImageUrl, Request),
                        Quantity = ci.Quantity,
                        AddedAt = ci.AddedAt
                    }).ToList(),
                    TotalItems = cart.CartItems.Sum(ci => ci.Quantity),
                    TotalAmount = cart.CartItems.Sum(ci => ci.Quantity * ci.Jewellery.Price)
                };
                return Ok(cartResponse);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting cart: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var cart = await GetOrCreateUserCart(userId);

                var existingCartItem = await _context.CartItems
                    .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.JewelleryId == request.JewelleryId);

                if (existingCartItem != null)
                {
                    existingCartItem.Quantity += request.Quantity;
                    cart.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var jewellery = await _context.Jewelleries.FindAsync(request.JewelleryId);
                    if (jewellery == null)
                    {
                        return NotFound(new { message = "Jewellery not found." });
                    }
                    _context.CartItems.Add(new CartItem
                    {
                        CartId = cart.Id,
                        JewelleryId = request.JewelleryId,
                        Quantity = request.Quantity,
                        AddedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item added to cart successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding to cart: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("update/{jewelleryId}")]
        public async Task<IActionResult> UpdateCartItem(int jewelleryId, [FromBody] UpdateCartItemRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Jewellery)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null)
                    return NotFound(new { message = "Cart not found." });

                var cartItem = cart.CartItems.FirstOrDefault(ci => ci.JewelleryId == jewelleryId);
                if (cartItem == null)
                    return NotFound(new { message = "Item not found in cart." });

                cartItem.Quantity = request.Quantity;
                cart.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cart item updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating cart item: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }


        [HttpDelete("remove/{jewelleryId}")]
        public async Task<IActionResult> RemoveFromCart(int jewelleryId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Jewellery)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null)
                {
                    return NotFound(new { message = "Cart not found." });
                }

                var cartItem = cart.CartItems.FirstOrDefault(ci => ci.JewelleryId == jewelleryId);
                if (cartItem == null)
                {
                    return NotFound(new { message = "Item not found in cart." });
                }

                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item removed from cart" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing from cart: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = GetCurrentUserId();

                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart != null && cart.CartItems.Any())
                {
                    _context.CartItems.RemoveRange(cart.CartItems);
                    cart.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                return Ok(new { message = "Cart cleared successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error clearing cart: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
        public class AddToCartRequest
        {
            public int JewelleryId { get; set; }
            public int Quantity { get; set; } = 1;
        }

        public class UpdateCartItemRequest
        {
            public int Quantity { get; set; }
        }
    }
}
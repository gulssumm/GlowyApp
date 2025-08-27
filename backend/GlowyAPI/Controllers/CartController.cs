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
                        ImageUrl = ci.Jewellery.ImageUrl,
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

                // Check if jewellery exists
                var jewellery = await _context.Jewelleries.FindAsync(request.JewelleryId);
                if (jewellery == null)
                {
                    return NotFound(new { message = "Jewellery not found" });
                }

                var cart = await GetOrCreateUserCart(userId);

                // Check if item already exists in cart
                var existingCartItem = cart.CartItems
                    .FirstOrDefault(ci => ci.JewelleryId == request.JewelleryId);

                if (existingCartItem != null)
                {
                    existingCartItem.Quantity += request.Quantity;
                }
                else
                {
                    var newCartItem = new CartItem
                    {
                        CartId = cart.Id,
                        JewelleryId = request.JewelleryId,
                        Quantity = request.Quantity,
                        AddedAt = DateTime.UtcNow
                    };
                    _context.CartItems.Add(newCartItem);
                }

                cart.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item added to cart successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding to cart: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("update/{itemId}")]
        public async Task<IActionResult> UpdateCartItem(int itemId, [FromBody] UpdateCartItemRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                var cartItem = await _context.CartItems
                    .Include(ci => ci.Cart)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Cart.UserId == userId);

                if (cartItem == null)
                {
                    return NotFound(new { message = "Cart item not found" });
                }

                if (request.Quantity <= 0)
                {
                    _context.CartItems.Remove(cartItem);
                }
                else
                {
                    cartItem.Quantity = request.Quantity;
                }

                cartItem.Cart.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cart updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating cart item: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{itemId}")]
        public async Task<IActionResult> RemoveFromCart(int itemId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var cartItem = await _context.CartItems
                    .Include(ci => ci.Cart)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Cart.UserId == userId);

                if (cartItem == null)
                {
                    return NotFound(new { message = "Cart item not found" });
                }

                _context.CartItems.Remove(cartItem);
                cartItem.Cart.UpdatedAt = DateTime.UtcNow;
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

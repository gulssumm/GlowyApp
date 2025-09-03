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
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
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

        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Get user's cart
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Jewellery)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null || !cart.CartItems.Any())
                {
                    return BadRequest(new { message = "Cart is empty" });
                }

                // Verify address belongs to user
                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == userId);

                if (address == null)
                {
                    return BadRequest(new { message = "Invalid address" });
                }

                // Calculate total amount
                var totalAmount = cart.CartItems.Sum(ci => ci.Quantity * ci.Jewellery.Price);

                // Create order
                var order = new Order
                {
                    UserId = userId,
                    AddressId = request.AddressId,
                    PaymentMethod = request.PaymentMethod,
                    TotalAmount = totalAmount,
                    Status = "Confirmed",
                    OrderDate = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Create order items from cart items
                var orderItems = cart.CartItems.Select(ci => new OrderItem
                {
                    OrderId = order.Id,
                    JewelleryId = ci.JewelleryId,
                    Quantity = ci.Quantity,
                    Price = ci.Jewellery.Price
                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                // Clear cart
                _context.CartItems.RemoveRange(cart.CartItems);
                cart.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Return order details with processed image URLs
                var orderResponse = new
                {
                    Id = order.Id,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    OrderDate = order.OrderDate,
                    PaymentMethod = order.PaymentMethod,
                    Address = new
                    {
                        Street = address.Street,
                        City = address.City,
                        State = address.State,
                        PostalCode = address.PostalCode,
                        Country = address.Country
                    },
                    Items = orderItems.Select(oi => new
                    {
                        JewelleryId = oi.JewelleryId,
                        Quantity = oi.Quantity,
                        Price = oi.Price
                    }).ToList()
                };

                return Ok(new { message = "Order created successfully", order = orderResponse });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating order: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserOrders()
        {
            try
            {
                var userId = GetCurrentUserId();
                var orders = await _context.Orders
                    .Include(o => o.Address)
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Jewellery)
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                var orderResponses = orders.Select(o => new
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    OrderDate = o.OrderDate,
                    PaymentMethod = o.PaymentMethod,
                    Address = new
                    {
                        Street = o.Address.Street,
                        City = o.Address.City,
                        State = o.Address.State,
                        PostalCode = o.Address.PostalCode,
                        Country = o.Address.Country
                    },
                    Items = o.OrderItems.Select(oi => new
                    {
                        Id = oi.Id,
                        JewelleryId = oi.JewelleryId,
                        Name = oi.Jewellery.Name,
                        ImageUrl = ImageUrlHelper.ProcessImageUrl(oi.Jewellery.ImageUrl, Request), 
                        Quantity = oi.Quantity,
                        Price = oi.Price
                    }).ToList()
                }).ToList();

                return Ok(orderResponses);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting orders: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrderById(int orderId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _context.Orders
                    .Include(o => o.Address)
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Jewellery)
                    .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                var orderResponse = new
                {
                    Id = order.Id,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    OrderDate = order.OrderDate,
                    PaymentMethod = order.PaymentMethod,
                    Address = new
                    {
                        Street = order.Address.Street,
                        City = order.Address.City,
                        State = order.Address.State,
                        PostalCode = order.Address.PostalCode,
                        Country = order.Address.Country
                    },
                    Items = order.OrderItems.Select(oi => new
                    {
                        Id = oi.Id,
                        JewelleryId = oi.JewelleryId,
                        Name = oi.Jewellery.Name,
                        Description = oi.Jewellery.Description,
                        ImageUrl = ImageUrlHelper.ProcessImageUrl(oi.Jewellery.ImageUrl, Request), 
                        Quantity = oi.Quantity,
                        Price = oi.Price
                    }).ToList()
                };

                return Ok(orderResponse);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting order: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        public class CreateOrderRequest
        {
            public int AddressId { get; set; }
            public string PaymentMethod { get; set; } = string.Empty;
        }
    }
}
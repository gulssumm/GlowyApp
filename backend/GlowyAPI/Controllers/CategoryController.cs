using GlowyAPI.Data;
using GlowyAPI.Helpers;
using GlowyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/category
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var categories = await _context.Categories
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.Name)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        description = c.Description,
                        iconName = c.IconName,
                        jewelryCount = c.Jewelleries.Count()
                    })
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAll Categories: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching categories" });
            }
        }

        // GET: api/category/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var category = await _context.Categories
                    .Where(c => c.Id == id && c.IsActive)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        description = c.Description,
                        iconName = c.IconName,
                        jewelryCount = c.Jewelleries.Count()
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    return NotFound(new { message = "Category not found" });
                }

                return Ok(category);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetById Category: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching category" });
            }
        }

        // POST: api/category (TODO: Admin only)
        [HttpPost]
        // [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto categoryDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if category with same name exists
                var existingCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryDto.Name.ToLower());

                if (existingCategory != null)
                {
                    return Conflict(new { message = "Category with this name already exists" });
                }

                var category = new Category
                {
                    Name = categoryDto.Name.Trim(),
                    Description = categoryDto.Description?.Trim() ?? string.Empty,
                    IconName = categoryDto.IconName?.Trim() ?? string.Empty,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                var result = new
                {
                    id = category.Id,
                    name = category.Name,
                    description = category.Description,
                    iconName = category.IconName,
                    jewelryCount = 0
                };

                return CreatedAtAction(nameof(GetById), new { id = category.Id }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating category: {ex.Message}");
                return StatusCode(500, new { message = "Error creating category" });
            }
        }

        // PUT: api/category/{id} (Admin only)
        [HttpPut("{id}")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto categoryDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new { message = "Category not found" });
                }

                // Check if another category with same name exists
                var existingCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryDto.Name.ToLower() && c.Id != id);

                if (existingCategory != null)
                {
                    return Conflict(new { message = "Category with this name already exists" });
                }

                category.Name = categoryDto.Name.Trim();
                category.Description = categoryDto.Description?.Trim() ?? string.Empty;
                category.IconName = categoryDto.IconName?.Trim() ?? string.Empty;
                category.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Category updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating category: {ex.Message}");
                return StatusCode(500, new { message = "Error updating category" });
            }
        }

        // DELETE: api/category/{id} (Admin only - soft delete)
        [HttpDelete("{id}")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.Jewelleries)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (category == null)
                {
                    return NotFound(new { message = "Category not found" });
                }

                // Check if category has associated jewelry items
                if (category.Jewelleries.Any())
                {
                    return BadRequest(new
                    {
                        message = "Cannot delete category with associated jewelry items",
                        jewelryCount = category.Jewelleries.Count()
                    });
                }

                // Soft delete
                category.IsActive = false;
                category.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Category deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting category: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting category" });
            }
        }

        // GET: api/category/{id}/jewelries
        [HttpGet("{id}/jewelries")]
        public async Task<IActionResult> GetCategoryJewelries(int id)
        {
            try
            {
                // Check if category exists and is active
                var exists = await _context.Categories.AnyAsync(c => c.Id == id && c.IsActive);
                if (!exists)
                {
                    return NotFound(new { message = "Category not found" });
                }

                // Fetch jewelries only (frontend expects an array)
                var jewelries = await _context.Jewelleries
                    .Where(j => j.CategoryId == id)
                    .Select(j => new
                    {
                        id = j.Id,
                        name = j.Name,
                        description = j.Description,
                        price = j.Price,
                        imageUrl = ImageUrlHelper.ProcessImageUrl(j.ImageUrl, Request),
                        categoryId = j.CategoryId
                    })
                    .ToListAsync();

                return Ok(jewelries);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching category jewelries: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching category jewelries" });
            }
        }


        // DTOs for API requests
        public class CreateCategoryDto
        {
            [Required]
            [MaxLength(100)]
            public string Name { get; set; } = string.Empty;

            [MaxLength(500)]
            public string? Description { get; set; }

            [MaxLength(100)]
            public string? IconName { get; set; }
        }

        public class UpdateCategoryDto
        {
            [Required]
            [MaxLength(100)]
            public string Name { get; set; } = string.Empty;

            [MaxLength(500)]
            public string? Description { get; set; }

            [MaxLength(100)]
            public string? IconName { get; set; }
        }
    }
}
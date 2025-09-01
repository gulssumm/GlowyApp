using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlowyAPI.Data;
using GlowyAPI.Models;
using GlowyAPI.Helpers;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JewelleryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JewelleryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/jewellery
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var items = await _context.Jewelleries.ToListAsync();
                Console.WriteLine($"Found {items.Count} jewelry items in database");

                // Process image URLs to ensure they're full URLs
                foreach (var item in items)
                {
                    var originalUrl = item.ImageUrl;
                    item.ImageUrl = ImageUrlHelper.ProcessImageUrl(item.ImageUrl, Request);
                    Console.WriteLine($"Item {item.Id}: {originalUrl} -> {item.ImageUrl}");
                }

                return Ok(items);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAll: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching jewelry items" });
            }
        }

        // GET: api/jewellery/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Jewelleries.FindAsync(id);
            if (item == null) return NotFound();

            item.ImageUrl = ImageUrlHelper.ProcessImageUrl(item.ImageUrl, Request);
            return Ok(item);
        }

        // POST: api/jewellery
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Jewellery jewellery)
        {
            // Store only the filename if it's a local image
            if (jewellery.ImageUrl.StartsWith($"{Request.Scheme}://{Request.Host}/images/jewelry/"))
            {
                jewellery.ImageUrl = Path.GetFileName(jewellery.ImageUrl);
            }

            _context.Jewelleries.Add(jewellery);
            await _context.SaveChangesAsync();

            jewellery.ImageUrl = ImageUrlHelper.ProcessImageUrl(jewellery.ImageUrl, Request);
            return CreatedAtAction(nameof(GetById), new { id = jewellery.Id }, jewellery);
        }

        // PUT: api/jewellery/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Jewellery jewellery)
        {
            var existing = await _context.Jewelleries.FindAsync(id);
            if (existing == null) return NotFound();

            // Store only the filename if it's a local image
            if (jewellery.ImageUrl.StartsWith($"{Request.Scheme}://{Request.Host}/images/jewelry/"))
            {
                jewellery.ImageUrl = Path.GetFileName(jewellery.ImageUrl);
            }

            existing.Name = jewellery.Name;
            existing.Description = jewellery.Description;
            existing.Price = jewellery.Price;
            existing.ImageUrl = jewellery.ImageUrl;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/jewellery/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.Jewelleries.FindAsync(id);
            if (item == null) return NotFound();

            // Delete associated image file if it's a local image
            if (!item.ImageUrl.StartsWith("http"))
            {
                var imagePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "images",
                    "jewelry",
                    item.ImageUrl
                );

                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _context.Jewelleries.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/jewellery/bulk
        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulk([FromBody] List<Jewellery> jewelleries)
        {
            if (jewelleries == null || jewelleries.Count == 0)
                return BadRequest("No jewellery data provided.");

            foreach (var jewellery in jewelleries)
            {
                // Process image URLs
                if (jewellery.ImageUrl.StartsWith($"{Request.Scheme}://{Request.Host}/images/jewelry/"))
                {
                    jewellery.ImageUrl = Path.GetFileName(jewellery.ImageUrl);
                }

                jewellery.CreatedAt = DateTime.UtcNow;
                jewellery.UpdatedAt = DateTime.UtcNow;
            }

            _context.Jewelleries.AddRange(jewelleries);
            await _context.SaveChangesAsync();

            // Return with processed URLs
            foreach (var jewellery in jewelleries)
            {
                jewellery.ImageUrl = ImageUrlHelper.ProcessImageUrl(jewellery.ImageUrl, Request);
            }

            return Ok(new { Count = jewelleries.Count, Message = "Jewelleries added successfully", Data = jewelleries });
        }

        // Add a debug endpoint to test image URLs
        [HttpGet("debug/images")]
        public IActionResult DebugImages()
        {
            var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var imagesPath = Path.Combine(wwwrootPath, "images", "jewelry");

            var filesList = new List<object>();
            if (Directory.Exists(imagesPath))
            {
                filesList = Directory.GetFiles(imagesPath).Select(f => new {
                    FileName = Path.GetFileName(f),
                    FullUrl = ImageUrlHelper.ProcessImageUrl(Path.GetFileName(f), Request)
                }).Cast<object>().ToList();
            }

            var debugInfo = new
            {
                WwwrootPath = wwwrootPath,
                ImagesPath = imagesPath,
                ImagesPathExists = Directory.Exists(imagesPath),
                BaseUrl = $"{Request.Scheme}://{Request.Host}",
                Files = filesList,
                FileCount = filesList.Count
            };

            return Ok(debugInfo);
        }
    }
}
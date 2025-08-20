using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlowyAPI.Data;
using GlowyAPI.Models;

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
            var items = await _context.Jewelleries.ToListAsync();
            return Ok(items);
        }

        // GET: api/jewellery/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Jewelleries.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        // POST: api/jewellery
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Jewellery jewellery)
        {
            _context.Jewelleries.Add(jewellery);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = jewellery.Id }, jewellery);
        }

        // PUT: api/jewellery/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Jewellery jewellery)
        {
            var existing = await _context.Jewelleries.FindAsync(id);
            if (existing == null) return NotFound();

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

            _context.Jewelleries.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

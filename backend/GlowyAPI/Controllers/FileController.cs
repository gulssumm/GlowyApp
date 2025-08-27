using Microsoft.AspNetCore.Mvc;

namespace GlowyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long _maxFileSize = 5 * 1024 * 1024; // 5MB

        public FileController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Validate file size
            if (file.Length > _maxFileSize)
                return BadRequest(new { message = "File too large. Maximum size is 5MB." });

            // Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Invalid file type. Only images are allowed." });

            try
            {
                // Create unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";

                // Create directory if it doesn't exist
                var uploadPath = Path.Combine(_environment.WebRootPath, "images", "jewelry");
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                // Save file
                var filePath = Path.Combine(uploadPath, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return the URL that can be used to access the image
                var imageUrl = $"{Request.Scheme}://{Request.Host}/images/jewelry/{fileName}";

                return Ok(new
                {
                    message = "File uploaded successfully",
                    imageUrl = imageUrl,
                    fileName = fileName
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading file: {ex.Message}");
                return StatusCode(500, new { message = "Error uploading file" });
            }
        }

        [HttpDelete("delete/{fileName}")]
        public IActionResult DeleteImage(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_environment.WebRootPath, "images", "jewelry", fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "File not found" });

                System.IO.File.Delete(filePath);
                return Ok(new { message = "File deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting file: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting file" });
            }
        }
    }
}
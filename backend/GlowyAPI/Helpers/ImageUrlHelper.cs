using Microsoft.AspNetCore.Http;

namespace GlowyAPI.Helpers
{
    public static class ImageUrlHelper
    {
        public static string ProcessImageUrl(string imageUrl, HttpRequest request)
        {
            // If it's already a full URL, return as is
            if (imageUrl.StartsWith("http://") || imageUrl.StartsWith("https://"))
                return imageUrl;

            // If it's just a filename, create full local URL
            return $"{request.Scheme}://{request.Host}/images/jewelry/{imageUrl}";
        }
    }
}
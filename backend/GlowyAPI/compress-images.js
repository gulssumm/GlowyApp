const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = path.join(__dirname, "wwwroot", "images", "jewelry");
const outputDir = path.join(__dirname, "wwwroot", "images", "jewelry_compressed");

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir).forEach(file => {
    if (file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg")) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);

        sharp(inputPath)
            .jpeg({ quality: 70 }) // Adjust quality (lower = smaller file, 70 is a good start)
            .toFile(outputPath)
            .then(() => console.log(`Compressed: ${file}`))
            .catch(err => console.error(`Error compressing ${file}:`, err));
    }
});
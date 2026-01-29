const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const pdfThumbnail = require('pdf-thumbnail');

class ThumbnailGenerator {
  constructor() {
    this.thumbnailWidth = 300;
    this.thumbnailHeight = 300;
  }

  async generateImageThumbnail(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .resize(this.thumbnailWidth, this.thumbnailHeight, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Error generating image thumbnail:', error);
      return null;
    }
  }

  async generatePdfThumbnail(inputPath, outputPath) {
    try {
      // Generate actual PDF thumbnail from first page
      const thumbnail = await pdfThumbnail(inputPath, {
        compress: {
          type: 'JPEG',
          quality: 80
        },
        width: this.thumbnailWidth,
        height: this.thumbnailHeight
      });

      // Save the thumbnail
      await fs.writeFile(outputPath, thumbnail);

      return outputPath;
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);

      // Fallback to placeholder if PDF thumbnail generation fails
      try {
        await sharp({
          create: {
            width: this.thumbnailWidth,
            height: this.thumbnailHeight,
            channels: 3,
            background: { r: 220, g: 53, b: 69 }
          }
        })
        .composite([{
          input: Buffer.from(`
            <svg width="300" height="300">
              <text x="50%" y="50%" text-anchor="middle" font-size="60" fill="white" font-family="Arial">PDF</text>
            </svg>
          `),
          top: 0,
          left: 0
        }])
        .jpeg()
        .toFile(outputPath);

        return outputPath;
      } catch (fallbackError) {
        console.error('Error generating fallback thumbnail:', fallbackError);
        return null;
      }
    }
  }

  async generateVideoThumbnail(inputPath, outputPath) {
    try {
      // For video thumbnails, we'll create a placeholder
      // In production, you can use ffmpeg or fluent-ffmpeg
      await sharp({
        create: {
          width: this.thumbnailWidth,
          height: this.thumbnailHeight,
          channels: 3,
          background: { r: 33, g: 150, b: 243 }
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="300" height="300">
            <polygon points="100,75 100,225 225,150" fill="white"/>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .jpeg()
      .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Error generating video thumbnail:', error);
      return null;
    }
  }

  async generatePresentationThumbnail(inputPath, outputPath) {
    try {
      // For presentation thumbnails, create a placeholder
      await sharp({
        create: {
          width: this.thumbnailWidth,
          height: this.thumbnailHeight,
          channels: 3,
          background: { r: 255, g: 152, b: 0 }
        }
      })
      .composite([{
        input: Buffer.from(`
          <svg width="300" height="300">
            <text x="50%" y="50%" text-anchor="middle" font-size="50" fill="white" font-family="Arial">PPT</text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .jpeg()
      .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('Error generating presentation thumbnail:', error);
      return null;
    }
  }

  async generate(inputPath, outputPath, type) {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    switch (type) {
      case 'image':
        return await this.generateImageThumbnail(inputPath, outputPath);
      case 'pdf':
        return await this.generatePdfThumbnail(inputPath, outputPath);
      case 'video':
        return await this.generateVideoThumbnail(inputPath, outputPath);
      case 'presentation':
        return await this.generatePresentationThumbnail(inputPath, outputPath);
      default:
        return null;
    }
  }
}

module.exports = new ThumbnailGenerator();

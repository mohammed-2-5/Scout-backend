const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const db = new sqlite3.Database('./database/scout.db');

// Stats
let stats = {
  total: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0
};

// Get file type folder in Cloudinary
function getCloudinaryFolder(type) {
  const folders = {
    'pdf': 'scout/pdfs',
    'image': 'scout/images',
    'video': 'scout/videos',
    'presentation': 'scout/presentations'
  };
  return folders[type] || 'scout/other';
}

// Get resource type for Cloudinary
function getResourceType(type) {
  if (type === 'video') return 'video';
  if (type === 'image') return 'image';
  return 'raw'; // For PDFs and presentations
}

// Upload single file to Cloudinary
async function uploadToCloudinary(filePath, type, publicId) {
  const folder = getCloudinaryFolder(type);
  const resourceType = getResourceType(type);

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
      use_filename: true
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Process all content
async function migrateContent() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRATING FILES TO CLOUDINARY                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ ERROR: Cloudinary credentials not found in .env file!');
    console.log('\nPlease create a .env file with:');
    console.log('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('  CLOUDINARY_API_KEY=your_api_key');
    console.log('  CLOUDINARY_API_SECRET=your_api_secret\n');
    process.exit(1);
  }

  console.log('✅ Cloudinary configured\n');

  // Get all content
  db.all('SELECT * FROM content ORDER BY type, id', async (err, rows) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      process.exit(1);
    }

    stats.total = rows.length;
    console.log(`📊 Found ${stats.total} files to upload\n`);

    // Process files one by one
    for (let i = 0; i < rows.length; i++) {
      const content = rows[i];
      const progress = `[${i + 1}/${stats.total}]`;

      // Check if file exists
      if (!fs.existsSync(content.file_path)) {
        console.log(`${progress} ⚠️  SKIP: ${content.title} (file not found)`);
        stats.skipped++;
        continue;
      }

      // Generate public ID (filename without extension)
      const filename = path.basename(content.file_path, path.extname(content.file_path));

      console.log(`${progress} 📤 Uploading: ${content.title} (${content.type})`);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(content.file_path, content.type, filename);

      if (result.success) {
        // Update database with Cloudinary URL
        const updateSql = `
          UPDATE content
          SET file_url = ?,
              thumbnail_url = ?
          WHERE id = ?
        `;

        // For images and videos, Cloudinary provides thumbnails automatically
        let thumbnailUrl = content.thumbnail_url;
        if (content.type === 'image') {
          thumbnailUrl = result.url.replace('/upload/', '/upload/c_thumb,w_300,h_300/');
        } else if (content.type === 'video') {
          thumbnailUrl = result.url.replace('/upload/', '/upload/c_thumb,w_300,h_300/').replace(/\.\w+$/, '.jpg');
        }

        db.run(updateSql, [result.url, thumbnailUrl, content.id], (err) => {
          if (err) {
            console.log(`${progress} ❌ Database update failed: ${err.message}`);
          }
        });

        console.log(`${progress} ✅ SUCCESS: ${content.title}`);
        stats.uploaded++;
      } else {
        console.log(`${progress} ❌ FAILED: ${content.title} - ${result.error}`);
        stats.failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    MIGRATION COMPLETE                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Uploaded:  ${stats.uploaded}/${stats.total}`);
    console.log(`⚠️  Skipped:   ${stats.skipped}`);
    console.log(`❌ Failed:    ${stats.failed}\n`);

    db.close();
  });
}

// Run migration
migrateContent();

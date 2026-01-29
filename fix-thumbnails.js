const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║            FIXING THUMBNAIL URLs IN DATABASE                  ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Get all content
db.all('SELECT id, title, type, file_url, thumbnail_url FROM content', (err, rows) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }

  console.log(`📊 Found ${rows.length} records\n`);

  let updated = 0;
  let skipped = 0;

  rows.forEach((content, index) => {
    const progress = `[${index + 1}/${rows.length}]`;

    // Skip if file_url is not a Cloudinary URL
    if (!content.file_url || !content.file_url.startsWith('http')) {
      console.log(`${progress} ⚠️  SKIP: ${content.title} (no Cloudinary URL)`);
      skipped++;
      return;
    }

    let newThumbnailUrl = content.thumbnail_url;

    // Generate Cloudinary thumbnail URL based on content type
    if (content.type === 'image') {
      // For images: add transformation for thumbnail
      newThumbnailUrl = content.file_url.replace('/upload/', '/upload/c_thumb,w_300,h_300/');
    } else if (content.type === 'video') {
      // For videos: add transformation and change extension to .jpg
      newThumbnailUrl = content.file_url
        .replace('/upload/', '/upload/c_thumb,w_300,h_300/')
        .replace(/\.\w+$/, '.jpg');
    } else if (content.type === 'pdf') {
      // For PDFs: use first page as thumbnail
      newThumbnailUrl = content.file_url
        .replace('/upload/', '/upload/c_thumb,w_300,h_300,pg_1/')
        .replace('.pdf', '.jpg');
    } else if (content.type === 'presentation') {
      // For presentations: use first slide as thumbnail
      newThumbnailUrl = content.file_url
        .replace('/upload/', '/upload/c_thumb,w_300,h_300,pg_1/')
        .replace(/\.(ppt|pptx)$/i, '.jpg');
    }

    // Update database
    db.run(
      'UPDATE content SET thumbnail_url = ? WHERE id = ?',
      [newThumbnailUrl, content.id],
      (err) => {
        if (err) {
          console.log(`${progress} ❌ FAILED: ${content.title} - ${err.message}`);
        } else {
          console.log(`${progress} ✅ Updated: ${content.title} (${content.type})`);
          updated++;
        }
      }
    );
  });

  // Wait for all updates to complete
  setTimeout(() => {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                     FIX COMPLETE                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Updated:  ${updated}`);
    console.log(`⚠️  Skipped:  ${skipped}\n`);

    db.close();
  }, 2000);
});

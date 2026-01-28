const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database/scout.db');

// Mapping of compressed files
const replacements = [
  {
    title: 'kashafa airscout (2)',
    oldPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\videos\\kashafa_airscout_(2).wmv',
    newPath: 'Y:\\لبني\\لبني\\kashafa airscout (2).mp4',
    newUploadPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\videos\\kashafa_airscout_(2).mp4',
    newUrl: '/uploads/videos/kashafa_airscout_(2).mp4',
    mimeType: 'video/mp4'
  },
  {
    title: 'poster',
    oldPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\images\\poster.jpg',
    newPath: 'Y:\\لبني\\لبني\\poster.jpg',
    newUploadPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\images\\poster.jpg',
    newUrl: '/uploads/images/poster.jpg',
    mimeType: 'image/jpeg'
  },
  {
    title: 'دليل شارات المتقدم',
    oldPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\pdf\\دليل_شارات_المتقدم.pdf',
    newPath: 'Y:\\لبني\\لبني\\دليل شارات المتقدم.pdf',
    newUploadPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\pdf\\دليل_شارات_المتقدم.pdf',
    newUrl: '/uploads/pdf/دليل_شارات_المتقدم.pdf',
    mimeType: 'application/pdf'
  },
  {
    title: 'شارات الفتيان 2020',
    oldPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\pdf\\شارات_الفتيان_2020.pdf',
    newPath: 'Y:\\لبني\\لبني\\شارات الفتيان 2020_compressed.pdf',
    newUploadPath: 'Y:\\لبني\\لبني\\scout-backend\\uploads\\pdf\\شارات_الفتيان_2020.pdf',
    newUrl: '/uploads/pdf/شارات_الفتيان_2020.pdf',
    mimeType: 'application/pdf'
  }
];

console.log('🔄 Replacing large files with compressed versions...\n');

let completed = 0;

replacements.forEach((item) => {
  // Check if compressed file exists
  if (!fs.existsSync(item.newPath)) {
    console.log(`❌ Compressed file not found: ${item.newPath}`);
    return;
  }

  // Copy compressed file to uploads folder
  try {
    fs.copyFileSync(item.newPath, item.newUploadPath);
    console.log(`✅ Copied: ${path.basename(item.newPath)}`);

    // Get new file size
    const stats = fs.statSync(item.newUploadPath);
    const newSize = stats.size;

    // Update database
    const sql = `
      UPDATE content
      SET file_path = ?,
          file_size = ?,
          mime_type = ?
      WHERE title = ? OR title_ar = ?
    `;

    db.run(sql, [item.newUploadPath, newSize, item.mimeType, item.title, item.title], (err) => {
      if (err) {
        console.log(`❌ Database update failed for ${item.title}: ${err.message}`);
      } else {
        console.log(`✅ Database updated: ${item.title}`);
        console.log(`   Old size: ${(fs.existsSync(item.oldPath) ? fs.statSync(item.oldPath).size : 0) / 1024 / 1024} MB`);
        console.log(`   New size: ${newSize / 1024 / 1024} MB\n`);
      }

      completed++;
      if (completed === replacements.length) {
        console.log('\n✅ All files replaced successfully!');
        db.close();
      }
    });
  } catch (err) {
    console.log(`❌ Copy failed for ${item.title}: ${err.message}`);
  }
});

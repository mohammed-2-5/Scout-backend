const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║           FAILED CLOUDINARY UPLOADS REPORT                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Get all content that was NOT migrated to Cloudinary
const sql = `
  SELECT id, title, title_ar, type, file_path, file_url, file_size
  FROM content
  WHERE file_url NOT LIKE '%cloudinary.com%'
  ORDER BY type, title
`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  console.log(`📊 Total files NOT uploaded to Cloudinary: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('🎉 All files successfully uploaded to Cloudinary!\n');
    db.close();
    return;
  }

  // Categorize failures
  const failures = {
    tooLarge: [],
    invalidName: [],
    other: []
  };

  rows.forEach(row => {
    const sizeMB = (row.file_size / 1024 / 1024).toFixed(2);
    const fileName = row.title || row.title_ar;

    // Check file size limits
    if (row.type === 'video' && row.file_size > 100 * 1024 * 1024) {
      failures.tooLarge.push({ ...row, reason: 'Video > 100MB', sizeMB });
    } else if ((row.type === 'pdf' || row.type === 'presentation') && row.file_size > 10 * 1024 * 1024) {
      failures.tooLarge.push({ ...row, reason: 'PDF/Presentation > 10MB', sizeMB });
    } else if (row.type === 'image' && row.file_size > 10 * 1024 * 1024) {
      failures.tooLarge.push({ ...row, reason: 'Image > 10MB', sizeMB });
    } else if (fileName.includes('&') || fileName.includes('<') || fileName.includes('>')) {
      failures.invalidName.push({ ...row, reason: 'Invalid characters in filename (&, <, >)', sizeMB });
    } else {
      failures.other.push({ ...row, reason: 'Unknown error', sizeMB });
    }
  });

  // Display results
  if (failures.tooLarge.length > 0) {
    console.log('❌ FILES TOO LARGE FOR CLOUDINARY FREE TIER:');
    console.log('─'.repeat(80));
    failures.tooLarge.forEach((f, i) => {
      console.log(`${i + 1}. ${f.title || f.title_ar}`);
      console.log(`   Type: ${f.type}`);
      console.log(`   Size: ${f.sizeMB} MB`);
      console.log(`   Reason: ${f.reason}`);
      console.log(`   File: ${f.file_path}`);
      console.log();
    });
  }

  if (failures.invalidName.length > 0) {
    console.log('❌ FILES WITH INVALID NAMES:');
    console.log('─'.repeat(80));
    failures.invalidName.forEach((f, i) => {
      console.log(`${i + 1}. ${f.title || f.title_ar}`);
      console.log(`   Type: ${f.type}`);
      console.log(`   Size: ${f.sizeMB} MB`);
      console.log(`   Reason: ${f.reason}`);
      console.log(`   File: ${f.file_path}`);
      console.log();
    });
  }

  if (failures.other.length > 0) {
    console.log('❌ OTHER FAILURES:');
    console.log('─'.repeat(80));
    failures.other.forEach((f, i) => {
      console.log(`${i + 1}. ${f.title || f.title_ar}`);
      console.log(`   Type: ${f.type}`);
      console.log(`   Size: ${f.sizeMB} MB`);
      console.log(`   Reason: ${f.reason}`);
      console.log(`   File: ${f.file_path}`);
      console.log();
    });
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📊 SUMMARY:\n');
  console.log(`   Too Large: ${failures.tooLarge.length}`);
  console.log(`   Invalid Name: ${failures.invalidName.length}`);
  console.log(`   Other: ${failures.other.length}`);
  console.log(`   ─────────────────────`);
  console.log(`   TOTAL FAILED: ${rows.length}\n`);

  // Recommendations
  console.log('💡 RECOMMENDATIONS:\n');
  if (failures.tooLarge.length > 0) {
    console.log('   • Compress large files to meet Cloudinary limits:');
    console.log('     - Videos: < 100MB');
    console.log('     - PDFs/Presentations: < 10MB');
    console.log('     - Images: < 10MB');
  }
  if (failures.invalidName.length > 0) {
    console.log('   • Rename files to remove special characters (&, <, >)');
  }
  console.log();

  db.close();
});

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database/scout.db');

const filesToExclude = [
  'كتاب التدريب الدولي الجزء الاول',
  'كتاب التدريب الدولي الجزء الثاني'
];

console.log('🗑️  Excluding large PDFs from backend...\n');

filesToExclude.forEach((title) => {
  // First get file paths
  const selectSql = 'SELECT id, title, file_path, thumbnail_path, file_size FROM content WHERE title = ? OR title_ar = ?';

  db.get(selectSql, [title, title], (err, row) => {
    if (err) {
      console.log(`❌ Error finding ${title}: ${err.message}`);
      return;
    }

    if (!row) {
      console.log(`⚠️  File not found in database: ${title}`);
      return;
    }

    console.log(`📄 ${title}`);
    console.log(`   Size: ${(row.file_size / 1024 / 1024).toFixed(2)} MB`);

    // Delete files from disk
    try {
      if (fs.existsSync(row.file_path)) {
        fs.unlinkSync(row.file_path);
        console.log(`   ✅ Deleted file`);
      }
      if (row.thumbnail_path && fs.existsSync(row.thumbnail_path)) {
        fs.unlinkSync(row.thumbnail_path);
        console.log(`   ✅ Deleted thumbnail`);
      }
    } catch (err) {
      console.log(`   ⚠️  Could not delete files: ${err.message}`);
    }

    // Delete from database
    const deleteSql = 'DELETE FROM content WHERE id = ?';
    db.run(deleteSql, [row.id], (err) => {
      if (err) {
        console.log(`   ❌ Database deletion failed: ${err.message}`);
      } else {
        console.log(`   ✅ Removed from database`);
      }
      console.log();
    });
  });
});

setTimeout(() => {
  db.close(() => {
    console.log('✅ Done! Large PDFs excluded.\n');
  });
}, 2000);

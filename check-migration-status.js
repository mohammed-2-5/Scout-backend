const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/scout.db');

console.log('📊 Checking Cloudinary Migration Status...\n');

// Count total files
db.get('SELECT COUNT(*) as total FROM content', (err, totalRow) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  // Count migrated files (those with Cloudinary URLs)
  db.get(`
    SELECT COUNT(*) as migrated
    FROM content
    WHERE file_url LIKE '%cloudinary.com%'
  `, (err, migratedRow) => {
    if (err) {
      console.error('Error:', err);
      return;
    }

    const total = totalRow.total;
    const migrated = migratedRow.migrated;
    const remaining = total - migrated;
    const percentage = ((migrated / total) * 100).toFixed(1);

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           CLOUDINARY MIGRATION STATUS                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Migrated:  ${migrated}/${total} files (${percentage}%)`);
    console.log(`⏳ Remaining: ${remaining} files`);

    // Progress bar
    const barLength = 50;
    const filledLength = Math.round((migrated / total) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`\n[${bar}] ${percentage}%\n`);

    if (migrated === total) {
      console.log('🎉 MIGRATION COMPLETE! All files uploaded to Cloudinary.\n');
    } else {
      console.log('⏱️  Migration in progress... Run this script again to check status.\n');
    }

    db.close();
  });
});

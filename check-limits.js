const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/scout.db');

const limits = {
  video: 100 * 1024 * 1024, // 100 MB
  pdf: 10 * 1024 * 1024,    // 10 MB
  image: 10 * 1024 * 1024   // 10 MB
};

const sql = `
  SELECT type, title, file_size, ROUND(file_size/1024.0/1024.0, 2) as size_mb
  FROM content
  WHERE (type = 'video' AND file_size > ?)
     OR (type = 'pdf' AND file_size > ?)
     OR (type = 'image' AND file_size > ?)
  ORDER BY type, file_size DESC
`;

db.all(sql, [limits.video, limits.pdf, limits.image], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }

  const videos = rows.filter(r => r.type === 'video');
  const pdfs = rows.filter(r => r.type === 'pdf');
  const images = rows.filter(r => r.type === 'image');

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  FILES EXCEEDING CLOUDINARY FREE TIER LIMITS                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 SUMMARY:`);
  console.log(`   Videos > 100MB: ${videos.length}`);
  console.log(`   PDFs > 10MB: ${pdfs.length}`);
  console.log(`   Images > 10MB: ${images.length}`);
  console.log(`   TOTAL: ${rows.length}\n`);

  if (videos.length > 0) {
    console.log('🎬 VIDEOS > 100MB:');
    console.log('─'.repeat(80));
    videos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.title}`);
      console.log(`   Size: ${v.size_mb} MB\n`);
    });
  }

  if (pdfs.length > 0) {
    console.log('📄 PDFs > 10MB:');
    console.log('─'.repeat(80));
    pdfs.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   Size: ${p.size_mb} MB\n`);
    });
  }

  if (images.length > 0) {
    console.log('🖼️ IMAGES > 10MB:');
    console.log('─'.repeat(80));
    images.forEach((img, i) => {
      console.log(`${i + 1}. ${img.title}`);
      console.log(`   Size: ${img.size_mb} MB\n`);
    });
  }

  db.close();
});

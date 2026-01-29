const db = require('./src/utils/database');
const path = require('path');
const fs = require('fs');

async function checkVideos() {
  await db.connect();

  const videos = await db.all(
    "SELECT id, title, file_path, file_url, mime_type FROM content WHERE type='video'"
  );

  console.log(`Total videos: ${videos.length}\n`);

  const videosByType = {};

  for (const video of videos) {
    const ext = path.extname(video.file_path).toLowerCase();
    if (!videosByType[ext]) {
      videosByType[ext] = [];
    }
    videosByType[ext].push({
      id: video.id,
      title: video.title,
      path: video.file_path,
      url: video.file_url,
      mime: video.mime_type,
      exists: fs.existsSync(video.file_path)
    });
  }

  console.log('Videos by extension:');
  for (const [ext, vids] of Object.entries(videosByType)) {
    console.log(`\n${ext}: ${vids.length} files`);
    vids.forEach(v => {
      console.log(`  - ID ${v.id}: ${v.title.substring(0, 50)} (exists: ${v.exists})`);
    });
  }

  await db.close();
}

checkVideos().catch(console.error);

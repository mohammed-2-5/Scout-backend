const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const db = require('./src/utils/database');
const path = require('path');
const fs = require('fs');

const logger = require('./src/utils/logger');

/**
 * Convert videos to MP4 format using FFmpeg
 * This script:
 * 1. Finds all non-MP4 videos in the database
 * 2. Converts them to MP4 using FFmpeg
 * 3. Updates database records with new file paths
 * 4. Keeps original files as backup
 */

async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

async function convertVideo(inputPath, outputPath) {
  // FFmpeg command with good quality settings
  // -i: input file
  // -c:v libx264: use H.264 codec for video
  // -preset medium: balance between speed and compression
  // -crf 23: quality (lower = better quality, 18-28 is good range)
  // -c:a aac: use AAC codec for audio
  // -b:a 128k: audio bitrate
  // -movflags +faststart: optimize for web streaming
  const cmd = `ffmpeg -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;

  logger.info(`Converting: ${path.basename(inputPath)}`);
  console.log(`Converting: ${path.basename(inputPath)}`);

  try {
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    return { success: true, output: stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎬 Video to MP4 Converter\n');
  console.log('='.repeat(60));

  // Check FFmpeg
  console.log('Checking FFmpeg installation...');
  const hasFFmpeg = await checkFFmpeg();
  if (!hasFFmpeg) {
    console.error('\n❌ FFmpeg is not installed!\n');
    console.log('Please install FFmpeg:');
    console.log('  Windows: Download from https://ffmpeg.org/download.html');
    console.log('           Or use chocolatey: choco install ffmpeg');
    console.log('  Linux:   sudo apt-get install ffmpeg');
    console.log('  Mac:     brew install ffmpeg\n');
    process.exit(1);
  }
  console.log('✅ FFmpeg is installed\n');

  // Connect to database
  await db.connect();

  // Get all non-MP4 videos
  const videos = await db.all(
    "SELECT id, title, file_path, file_url, thumbnail_path, thumbnail_url, mime_type FROM content WHERE type='video' AND file_path NOT LIKE '%.mp4'"
  );

  console.log(`Found ${videos.length} videos to convert\n`);

  if (videos.length === 0) {
    console.log('✅ All videos are already in MP4 format!');
    await db.close();
    return;
  }

  let converted = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = `[${i + 1}/${videos.length}]`;

    console.log(`\n${progress} Processing: ${video.title}`);
    console.log(`    Original: ${path.basename(video.file_path)}`);

    // Check if original file exists
    if (!fs.existsSync(video.file_path)) {
      console.log(`    ⚠️  Original file not found, skipping`);
      skipped++;
      continue;
    }

    // Generate new MP4 path
    const dir = path.dirname(video.file_path);
    const basename = path.basename(video.file_path, path.extname(video.file_path));
    const newPath = path.join(dir, `${basename}.mp4`);

    // Check if MP4 already exists
    if (fs.existsSync(newPath)) {
      console.log(`    ℹ️  MP4 already exists, updating database only`);
    } else {
      // Convert video
      const result = await convertVideo(video.file_path, newPath);

      if (!result.success) {
        console.log(`    ❌ Conversion failed: ${result.error}`);
        logger.error(`Failed to convert video ${video.id}: ${result.error}`);
        failed++;
        continue;
      }

      console.log(`    ✅ Converted successfully`);
    }

    // Update database
    try {
      const newUrl = video.file_url.replace(path.extname(video.file_path), '.mp4');

      await db.run(
        `UPDATE content SET file_path = ?, file_url = ?, mime_type = ? WHERE id = ?`,
        [newPath, newUrl, 'video/mp4', video.id]
      );

      console.log(`    ✅ Database updated`);
      converted++;

      // Optionally delete original file (commented out for safety)
      // fs.unlinkSync(video.file_path);
      // console.log(`    🗑️  Original file removed`);

    } catch (error) {
      console.log(`    ❌ Database update failed: ${error.message}`);
      logger.error(`Failed to update database for video ${video.id}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Conversion Summary:');
  console.log(`   ✅ Converted: ${converted}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   📁 Total: ${videos.length}\n`);

  if (converted > 0) {
    console.log('ℹ️  Original files have been kept as backup.');
    console.log('   You can manually delete them after verifying the MP4 files work correctly.\n');
  }

  await db.close();
  console.log('Done!\n');
}

main().catch(error => {
  console.error('Error:', error);
  logger.error('Video conversion error:', error);
  process.exit(1);
});

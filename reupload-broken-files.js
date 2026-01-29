const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
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

// Broken file IDs from our check
const brokenIds = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 64, 65, 66, 67, 68, 69, 156, 160, 161, 162, 163, 179, 183, 186, 187, 188, 189, 190, 191, 196, 381, 382, 383, 388, 389, 390, 391, 392, 393, 394, 395, 396, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 836, 837, 839, 895, 896, 897, 898, 899, 900, 901, 910, 979];

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║      RE-UPLOADING BROKEN FILES TO CLOUDINARY                 ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');
console.log(`📊 ${brokenIds.length} files to re-upload\n`);

function getFolder(type) {
    switch (type) {
        case 'video': return 'scout/videos';
        case 'image': return 'scout/images';
        case 'pdf': return 'scout/pdfs';
        case 'presentation': return 'scout/presentations';
        default: return 'scout/documents';
    }
}

function getResourceType(type) {
    if (type === 'video') return 'video';
    if (type === 'image') return 'image';
    return 'raw'; // pdf, presentation, document
}

async function uploadFile(filePath, type) {
    const folder = getFolder(type);
    const resourceType = getResourceType(type);

    const options = {
        folder: folder,
        resource_type: resourceType,
        overwrite: true,
        use_filename: true,
        access_mode: 'public'
    };

    return await cloudinary.uploader.upload(filePath, options);
}

async function reuploadFiles() {
    return new Promise((resolve, reject) => {
        const placeholders = brokenIds.map(() => '?').join(',');

        db.all(`SELECT id, title, type, file_path, mime_type FROM content WHERE id IN (${placeholders})`, brokenIds, async (err, rows) => {
            if (err) {
                console.error('❌ Database error:', err.message);
                reject(err);
                return;
            }

            console.log(`📁 Found ${rows.length} records in database\n`);

            let success = 0;
            let failed = 0;
            let skipped = 0;

            for (let i = 0; i < rows.length; i++) {
                const content = rows[i];

                // Check if local file exists
                if (!content.file_path || !fs.existsSync(content.file_path)) {
                    console.log(`[${i + 1}/${rows.length}] ⚠️ SKIP (no local file): ${content.title}`);
                    skipped++;
                    continue;
                }

                try {
                    console.log(`[${i + 1}/${rows.length}] 📤 Uploading: ${content.title}...`);
                    const result = await uploadFile(content.file_path, content.type);

                    // Update database with new Cloudinary URL
                    await new Promise((res, rej) => {
                        db.run('UPDATE content SET file_url = ? WHERE id = ?',
                            [result.secure_url, content.id],
                            (err) => err ? rej(err) : res()
                        );
                    });

                    console.log(`[${i + 1}/${rows.length}] ✅ Done: ${content.title}`);
                    success++;
                } catch (error) {
                    console.log(`[${i + 1}/${rows.length}] ❌ FAILED: ${content.title} - ${error.message}`);
                    failed++;
                }

                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 500));
            }

            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                     UPLOAD COMPLETE                           ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            console.log(`✅ Success: ${success}`);
            console.log(`❌ Failed:  ${failed}`);
            console.log(`⚠️ Skipped: ${skipped}\n`);

            db.close();
            resolve();
        });
    });
}

reuploadFiles().catch(console.error);

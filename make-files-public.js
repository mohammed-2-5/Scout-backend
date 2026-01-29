const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║      UPDATING CLOUDINARY FILES TO PUBLIC ACCESS (v2)         ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Get public ID from Cloudinary URL - keep it URL-encoded
function getPublicIdFromUrl(url) {
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        // Remove version and get the rest as public ID (keep URL encoding)
        let pathPart = parts[1].replace(/^v\d+\//, '');
        // Remove file extension
        pathPart = pathPart.replace(/\.\w+$/, '');
        return pathPart; // Don't decode - keep it as-is
    } catch (error) {
        return null;
    }
}

// Get resource type from content type
function getResourceType(type) {
    if (type === 'video') return 'video';
    if (type === 'image') return 'image';
    return 'raw';
}

async function makeFilesPublic() {
    return new Promise((resolve, reject) => {
        // Get all PDFs and presentations that have Cloudinary URLs
        db.all(`SELECT id, title, type, file_url FROM content 
                WHERE file_url LIKE '%cloudinary%' 
                AND (type = 'pdf' OR type = 'presentation')`, async (err, rows) => {
            if (err) {
                console.error('❌ Database error:', err.message);
                reject(err);
                return;
            }

            console.log(`📊 Found ${rows.length} PDF/Presentation files to update\n`);

            let success = 0;
            let failed = 0;
            let alreadyPublic = 0;

            for (let i = 0; i < rows.length; i++) {
                const content = rows[i];
                const publicId = getPublicIdFromUrl(content.file_url);
                const resourceType = getResourceType(content.type);

                if (!publicId) {
                    console.log(`[${i + 1}/${rows.length}] ⚠️ SKIP: ${content.title} (no public ID)`);
                    continue;
                }

                try {
                    // First, try to get the resource info
                    const resource = await cloudinary.api.resource(publicId, {
                        resource_type: resourceType
                    });

                    // Check if already public
                    if (resource.access_mode === 'public') {
                        console.log(`[${i + 1}/${rows.length}] ✓ Already public: ${content.title}`);
                        alreadyPublic++;
                        continue;
                    }

                    // Update the resource to be public
                    await cloudinary.api.update(publicId, {
                        resource_type: resourceType,
                        access_mode: 'public'
                    });
                    console.log(`[${i + 1}/${rows.length}] ✅ Updated: ${content.title}`);
                    success++;
                } catch (error) {
                    const errorMsg = error.error?.message || error.message || JSON.stringify(error);

                    // If resource not found, it might be accessible directly anyway
                    if (errorMsg.includes('not found') || errorMsg.includes('Resource not found')) {
                        console.log(`[${i + 1}/${rows.length}] ⚠️ Not in API (may be accessible): ${content.title}`);
                    } else {
                        console.log(`[${i + 1}/${rows.length}] ❌ FAILED: ${content.title}`);
                        console.log(`   Error: ${errorMsg}`);
                        console.log(`   PublicID: ${publicId.substring(0, 50)}...`);
                    }
                    failed++;
                }

                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 200));
            }

            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                     UPDATE COMPLETE                           ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            console.log(`✅ Updated:       ${success}`);
            console.log(`✓ Already public: ${alreadyPublic}`);
            console.log(`❌ Failed/Other:  ${failed}\n`);

            db.close();
            resolve();
        });
    });
}

makeFilesPublic().catch(console.error);

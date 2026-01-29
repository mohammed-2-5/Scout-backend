const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║      CHECKING CLOUDINARY FILE ACCESSIBILITY                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

async function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve({ status: res.statusCode, ok: res.statusCode === 200 });
        }).on('error', (e) => {
            resolve({ status: 0, ok: false, error: e.message });
        });
    });
}

async function checkFiles() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, title, type, file_url FROM content 
                WHERE file_url LIKE '%cloudinary%' 
                AND type = 'pdf'
                ORDER BY id`, async (err, rows) => {
            if (err) {
                console.error('❌ Database error:', err.message);
                reject(err);
                return;
            }

            console.log(`📊 Found ${rows.length} PDF files to check\n`);

            let working = 0;
            let broken = [];

            for (let i = 0; i < rows.length; i++) {
                const content = rows[i];
                const result = await checkUrl(content.file_url);

                if (result.ok) {
                    console.log(`[${i + 1}/${rows.length}] ✅ OK: ${content.title}`);
                    working++;
                } else {
                    console.log(`[${i + 1}/${rows.length}] ❌ ${result.status}: ${content.title}`);
                    broken.push({ id: content.id, title: content.title, url: content.file_url });
                }

                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 100));
            }

            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                     CHECK COMPLETE                            ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            console.log(`✅ Working: ${working}`);
            console.log(`❌ Broken:  ${broken.length}\n`);

            if (broken.length > 0) {
                console.log('Broken file IDs:', broken.map(b => b.id).join(', '));
            }

            db.close();
            resolve();
        });
    });
}

checkFiles().catch(console.error);

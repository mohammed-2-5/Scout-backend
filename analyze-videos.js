const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/scout.db');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                VIDEO FORMAT ANALYSIS                          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

db.all(`SELECT id, title, file_url, mime_type, file_path FROM content WHERE type = 'video'`, (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(`📊 Found ${rows.length} videos.`);

    const formats = {};
    const nonMp4 = [];

    rows.forEach(row => {
        // value check for null url
        if (!row.file_url) return;

        const ext = row.file_url.split('.').pop().toLowerCase();
        formats[ext] = (formats[ext] || 0) + 1;

        if (ext !== 'mp4') {
            nonMp4.push({
                id: row.id,
                title: row.title,
                url: row.file_url,
                ext: ext,
                mime: row.mime_type
            });
        }
    });

    console.log('\n📁 Formats Distribution:');
    console.table(formats);

    if (nonMp4.length > 0) {
        console.log(`\n⚠️ Found ${nonMp4.length} non-MP4 videos:`);
        nonMp4.forEach(v => {
            console.log(`   [${v.id}] ${v.ext.toUpperCase()} - ${v.title}`);
            console.log(`   URL: ${v.url}`);
        });
    } else {
        console.log('\n✅ All videos seem to be MP4 already (by extension).');
    }

    db.close();
});

const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/scout.db');

console.log('Testing direct Cloudinary URL access...\n');

// Get one PDF file URL
db.get(`SELECT title, file_url FROM content WHERE type = 'pdf' AND file_url LIKE '%cloudinary%' LIMIT 1`, (err, row) => {
    if (err) {
        console.error('DB Error:', err);
        db.close();
        return;
    }

    console.log('Testing file:', row.title);
    console.log('URL:', row.file_url);
    console.log('');

    // Try to access the URL
    https.get(row.file_url, (res) => {
        console.log('HTTP Status:', res.statusCode);
        console.log('Status Message:', res.statusMessage);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        db.close();
    }).on('error', (e) => {
        console.error('Request Error:', e.message);
        db.close();
    });
});

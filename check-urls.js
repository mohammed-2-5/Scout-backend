const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/scout.db');

db.get("SELECT file_url, thumbnail_url FROM content WHERE type = 'pdf' LIMIT 1", (err, row) => {
    if (err) console.error(err);
    else {
        console.log('File URL:', row.file_url);
        console.log('Thumbnail URL:', row.thumbnail_url);
    }
    db.close();
});

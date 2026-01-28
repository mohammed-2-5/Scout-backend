const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.resolve(process.env.DATABASE_PATH || './database/scout.db');

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Categories table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            name_ar TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            parent_id INTEGER,
            order_index INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES categories(id)
          )
        `);

        // Content table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            title_ar TEXT,
            description TEXT,
            category_id INTEGER,
            type TEXT NOT NULL CHECK(type IN ('pdf', 'image', 'video', 'presentation')),
            file_path TEXT NOT NULL,
            file_url TEXT NOT NULL,
            thumbnail_path TEXT,
            thumbnail_url TEXT,
            file_size INTEGER,
            mime_type TEXT,
            tags TEXT,
            view_count INTEGER DEFAULT 0,
            download_count INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
          )
        `);

        // Create indexes
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_content_category ON content(category_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_content_type ON content(type)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_content_featured ON content(is_featured)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database tables initialized');
            resolve();
          }
        });
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();

const db = require('../src/utils/database');

async function initDatabase() {
  console.log('🚀 Initializing database...\n');

  try {
    await db.connect();
    console.log('✅ Database initialized successfully!');
    console.log('📁 Database location:', process.env.DATABASE_PATH || './database/scout.db');
    await db.close();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();

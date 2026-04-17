require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('⏳ Updating database schema...');
  try {
    await db.query('ALTER TABLE users ADD COLUMN address VARCHAR(255), ADD COLUMN city VARCHAR(100), ADD COLUMN state VARCHAR(100), ADD COLUMN zip VARCHAR(20), ADD COLUMN country VARCHAR(50)');
    console.log('✅ Successfully added new address columns to the users table!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('👍 Columns already exist. Database is up to date!');
    } else {
      console.error('❌ Database error:', err.message);
    }
  } finally {
    process.exit();
  }
}

migrate();
require('dotenv').config();
const mysql = require('mysql2');

async function testConnection() {
  console.log('⏳ Attempting to connect to MySQL...');
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bookmart',
      port: process.env.DB_PORT || 3306,
    }).promise();

    const [rows] = await pool.query('SHOW TABLES');
    console.log('✅ Connection successful!');
    console.log('📦 Tables found in the "bookmart" database:');
    rows.forEach(row => console.log(`   - ${Object.values(row)[0]}`));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database connection failed:');
    console.error('   ', err.message);
    process.exit(1);
  }
}

testConnection();
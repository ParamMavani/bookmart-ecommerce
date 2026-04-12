require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function resetAdmin() {
  try {
    const newPassword = 'Admin@1234';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@bookmart.com']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Admin password successfully updated to: ' + newPassword);
    } else {
      console.log('❌ Admin user not found. Make sure the database was seeded.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

resetAdmin();
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedAll() {
  try {
    console.log('🌱 Starting database seed...');

    // 1. Seed Customer Users
    const hash = await bcrypt.hash('password123', 10);
    await db.query(`INSERT IGNORE INTO users (id, name, email, password, role) VALUES 
      (2, 'John Doe', 'john@example.com', ?, 'customer'),
      (3, 'Jane Smith', 'jane@example.com', ?, 'customer')`, [hash, hash]);
    console.log('✅ Users seeded (john@example.com, jane@example.com | pw: password123)');

    // 2. Seed Categories
    await db.query(`INSERT IGNORE INTO categories (id, name, slug) VALUES 
      (1, 'Fiction', 'fiction'), (2, 'Science & Tech', 'science-tech'), 
      (3, 'Self-Help', 'self-help'), (4, 'History', 'history'), (5, 'Business', 'business')`);
    console.log('✅ Categories seeded');

    // 3. Seed Products
    await db.query(`INSERT IGNORE INTO products (id, title, author, description, price, stock, category_id, rating) VALUES 
      (1, 'The Pragmatic Programmer', 'David Thomas', 'A masterclass in software engineering.', 39.99, 50, 2, 4.8),
      (2, 'Clean Code', 'Robert C. Martin', 'Agile Software Craftsmanship.', 45.00, 30, 2, 4.9),
      (3, 'Dune', 'Frank Herbert', 'Science fiction masterpiece.', 15.99, 100, 1, 4.7),
      (4, 'Atomic Habits', 'James Clear', 'Build Good Habits.', 20.00, 200, 3, 4.9),
      (5, 'Sapiens', 'Yuval Noah Harari', 'A Brief History of Humankind.', 24.99, 80, 4, 4.8),
      (6, '1984', 'George Orwell', 'Dystopian novel.', 12.99, 45, 1, 4.6),
      (7, 'Think and Grow Rich', 'Napoleon Hill', 'Classic wealth book.', 14.50, 60, 5, 4.5),
      (8, 'Steve Jobs', 'Walter Isaacson', 'Biography of Apple co-founder.', 22.00, 40, 5, 4.7)`);
    console.log('✅ Products seeded');

    // 4. Seed Cart Items (John Doe has items in his cart)
    await db.query(`INSERT IGNORE INTO cart_items (id, user_id, product_id, quantity) VALUES 
      (1, 2, 1, 1),
      (2, 2, 4, 2)`);
    console.log('✅ Cart items seeded');

    // 5. Seed Orders (Jane has a paid order, John has a pending one)
    await db.query(`INSERT IGNORE INTO orders (id, user_id, subtotal, tax, total, status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country) VALUES 
      (1, 3, 39.99, 3.20, 43.19, 'paid', 'Jane Smith', 'jane@example.com', '123 Tech Lane', 'San Francisco', 'CA', '10001', 'US'),
      (2, 2, 45.00, 3.60, 48.60, 'pending', 'John Doe', 'john@example.com', '456 Fiction Blvd', 'Seattle', 'WA', '94105', 'US')`);
    
    // 6. Seed Order Items
    await db.query(`INSERT IGNORE INTO order_items (id, order_id, product_id, quantity, price) VALUES 
      (1, 1, 1, 1, 39.99),
      (2, 2, 2, 1, 45.00)`);
    console.log('✅ Orders & Order Items seeded');

    console.log('🎉 All dummy data successfully populated!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seedAll();
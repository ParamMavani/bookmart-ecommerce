const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json({ success: true, categories });
  } catch (err) { 
    console.error('\n❌ DB Error in /categories:', err.message);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

router.get('/', async (req, res) => {
  const { category, search, sort, limit = 12, page = 1 } = req.query;
  let query = 'SELECT p.*, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND c.slug = ?'; params.push(category);
  }
  if (search) {
    query += ' AND (p.title LIKE ? OR p.author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'rating') query += ' ORDER BY p.rating DESC';
  else if (sort === 'title') query += ' ORDER BY p.title ASC';
  else if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
  else query += ' ORDER BY p.id DESC';

  try {
    const [allProducts] = await db.query(query, params);
    const total = allProducts.length;
    
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt((page - 1) * limit));
    const [products] = await db.query(query, params);
    
    res.json({ success: true, products, total });
  } catch (err) { 
    console.error('\n❌ DB Error in /products:', err.message);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
    if (products.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, product: products[0] });
  } catch (err) { 
    console.error('\n❌ DB Error in /products/:id:', err.message);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

module.exports = router;
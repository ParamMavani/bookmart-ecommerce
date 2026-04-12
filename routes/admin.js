// routes/admin.js — Admin-only CRUD for products & orders
const express  = require('express');
const { body, validationResult } = require('express-validator');
const db       = require('../config/db');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const router   = express.Router();

router.use(requireLogin, requireAdmin);

// ── GET /api/admin/dashboard ──────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalOrders }]]   = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]]  = await db.query("SELECT COALESCE(SUM(total),0) AS totalRevenue FROM orders WHERE status='paid'");
    const [[{ totalUsers }]]    = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [recentOrders]        = await db.query(`
      SELECT o.*, u.name AS user_name, u.email AS user_email
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10`);
    const [topProducts] = await db.query(`
      SELECT p.title, p.author, SUM(oi.quantity) AS units_sold,
             SUM(oi.price * oi.quantity) AS revenue
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      GROUP BY p.id ORDER BY units_sold DESC LIMIT 5`);

    res.json({ success: true, stats: { totalOrders, totalRevenue, totalUsers, totalProducts }, recentOrders, topProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
});

// ── GET /api/admin/products ───────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC`);
    res.json({ success: true, products: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load products.' });
  }
});

// ── POST /api/admin/products ──────────────────────────────
router.post('/products', [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category_id').optional({ nullable: true }).isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { title, author, description, price, stock, image_url, isbn, rating, category_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (title, author, description, price, stock, image_url, isbn, rating, category_id) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, author || null, description || null, price, stock || 0, image_url || null, isbn || null, rating || 4.0, category_id || null]
    );
    res.json({ success: true, message: 'Product created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// ── PUT /api/admin/products/:id ───────────────────────────
router.put('/products/:id', [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category_id').optional({ nullable: true }).isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { title, author, description, price, stock, image_url, isbn, rating, category_id } = req.body;
  try {
    await db.query(
      'UPDATE products SET title=?, author=?, description=?, price=?, stock=?, image_url=?, isbn=?, rating=?, category_id=? WHERE id=?',
      [title, author, description, price, stock, image_url, isbn, rating, category_id, req.params.id]
    );
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// ── DELETE /api/admin/products/:id ────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// ── GET /api/admin/orders ─────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name AS user_name, u.email AS user_email
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC`);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load orders.' });
  }
});

// ── PATCH /api/admin/orders/:id/status ───────────────────
router.patch('/orders/:id/status', [
  body('status').isIn(['pending', 'paid', 'cancelled', 'refunded']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
});

module.exports = router;

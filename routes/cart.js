const express = require('express');
const db = require('../config/db');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.use(requireLogin);

router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.author, p.price, p.image_url 
      FROM cart_items c JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?`, [req.session.userId]);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, items, subtotal });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/', async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.session.userId, product_id]);
    if (existing.length > 0) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await db.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.session.userId, product_id, quantity]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/:id', async (req, res) => {
  try {
    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [req.body.quantity, req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
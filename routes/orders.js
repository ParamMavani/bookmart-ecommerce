const express = require('express');
const db = require('../config/db');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.use(requireLogin);

router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/create-paypal-order', async (req, res) => {
  res.json({ success: true, orderID: 'DEV-MOCK-' + Date.now() });
});

router.post('/capture-paypal-order', async (req, res) => {
  const { orderID, shipping } = req.body;
  const userId = req.session.userId;
  try {
    const [items] = await db.query(`
      SELECT c.product_id, c.quantity, p.price 
      FROM cart_items c JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?`, [userId]);
    
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Cart empty.' });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const [orderResult] = await db.query(`
      INSERT INTO orders (user_id, subtotal, tax, total, status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, paypal_order_id)
      VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, subtotal, tax, total, shipping.name, shipping.email, shipping.address, shipping.city, shipping.state, shipping.zip, shipping.country, orderID]);
    
    const newOrderId = orderResult.insertId;

    for (let item of items) {
      await db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [newOrderId, item.product_id, item.quantity, item.price]);
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ success: true, orderId: newOrderId });
  } catch (err) { res.status(500).json({ success: false, message: 'Capture failed.' }); }
});

module.exports = router;
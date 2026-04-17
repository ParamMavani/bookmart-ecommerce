const express = require('express');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.use(requireLogin);

router.get('/profile', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, address, city, state, zip, country FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: users[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/profile', async (req, res) => {
  const { name, email, password, address, city, state, zip, country } = req.body;
  try {
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name=?, email=?, address=?, city=?, state=?, zip=?, country=?, password=? WHERE id=?', 
        [name, email, address, city, state, zip, country, hash, req.session.userId]);
    } else {
      await db.query('UPDATE users SET name=?, email=?, address=?, city=?, state=?, zip=?, country=? WHERE id=?', 
        [name, email, address, city, state, zip, country, req.session.userId]);
    }
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) { 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile.' }); 
  }
});

router.delete('/profile', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Password is required to deactivate account.' });

  try {
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(password, users[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.session.userId]);
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Could not log out after deactivation.' });
      res.json({ success: true, message: 'Account deactivated successfully.' });
    });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error during deactivation.' }); }
});

module.exports = router;
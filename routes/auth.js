const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.json({ success: true, message: 'Registration successful. You can now log in.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Email already exists or invalid data.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const user = users[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, message: `Welcome back, ${user.name}!`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/reactivate', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    const user = users[0];
    if (user.is_active) return res.status(400).json({ success: false, message: 'Account is already active.' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await db.query('UPDATE users SET is_active = TRUE WHERE id = ?', [user.id]);
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, message: `Welcome back, ${user.name}! Your account has been reactivated.` });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ loggedIn: false });
  try {
    const [users] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, ...users[0] });
  } catch (err) { res.json({ loggedIn: false }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out.' });
});

module.exports = router;
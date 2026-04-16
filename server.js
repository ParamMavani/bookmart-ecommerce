// server.js — BookMart E-Commerce Server
require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const fs           = require('fs');
const db           = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.paypal.com", "https://*.sandbox.paypal.com", "https://*.paypalobjects.com", "https://js.braintreegateway.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc:     ["'self'", "data:", "https:", "http:"],
      frameSrc:   ["'self'", "https://*.paypal.com", "https://*.sandbox.paypal.com"],
      connectSrc: ["'self'", "https://*.paypal.com", "https://*.sandbox.paypal.com", "https://*.paypalobjects.com"],
    }
  }
}));

app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────
// Production: swap MemoryStore for connect-mysql or connect-redis
app.use(session({
  secret:            process.env.SESSION_SECRET || 'bookmart-dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000   // 7 days
  }
}));

// ── Serve HTML with Env Variables ─────────────────────────
const serveIndex = (req, res) => {
  fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading application.');
    const clientId = (process.env.PAYPAL_CLIENT_ID || 'test').trim();
    res.send(html.replace('{{PAYPAL_CLIENT_ID}}', clientId));
  });
};

app.get('/', serveIndex);
app.get('/index.html', serveIndex);

// ── Static Files ──────────────────────────────────────────
app.use(express.static(__dirname, { index: false }));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

// ── SPA Fallback ──────────────────────────────────────────
// All non-API routes serve index.html (client-side routing)
app.get(/.*/, serveIndex);

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  BookMart running at http://localhost:${PORT}`);
  console.log(`📦  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳  PayPal mode:  ${process.env.PAYPAL_MODE || 'sandbox'}\n`);
});

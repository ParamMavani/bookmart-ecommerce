const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Please log in first.' });
};

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: 'Forbidden: Admins only.' });
};

module.exports = { requireLogin, requireAdmin };

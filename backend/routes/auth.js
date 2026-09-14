const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verifyPassword, generateToken } = require('../utils/auth');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    // Generate token and create session (valid for 7 days)
    const token = generateToken();
    db.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `).run(user.id, token);

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };

    res.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.body?.token;

    if (token) {
      db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
    }

    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;

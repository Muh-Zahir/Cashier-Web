const db = require('../database/db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Akses ditolak: Token autentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const session = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.username, u.name, u.role, u.avatar
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `).get(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Sesi telah berakhir atau token tidak valid' });
    }

    req.user = {
      id: session.id,
      username: session.username,
      name: session.name,
      role: session.role,
      avatar: session.avatar,
    };
    req.token = token;

    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Kesalahan autentikasi: ' + err.message });
  }
}

module.exports = { requireAuth };

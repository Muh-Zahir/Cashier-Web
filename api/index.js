import crypto from 'crypto';

// Turso Connection
const rawUrl = process.env.TURSO_DATABASE_URL || 'https://kasir-db-muh-zahir.aws-ap-northeast-1.turso.io';
const TURSO_URL = rawUrl.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '') + (rawUrl.includes('/v2/pipeline') ? '' : '/v2/pipeline');
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk1NDU5MzAsImlkIjoiMDFhMGE5M2YtMjUwMS03NWQyLWI3MWEtODg5YzJiMmViYTM3Iiwia2lkIjoiQVRyQkVNTEMzX2R2ajRjdXY1Qm5KRnkxdG5EaWk4SlA5QS1ENGFWNjhNayIsInJpZCI6IjJmOGUwODIwLTY5NmMtNGI2My1hMjFjLWZkYzQ1NDhiNjNjMCJ9.hAtq7Qr6_dF5-tiaQsSWCLmg0EWTcCpr9gLOwKecMW4SnV2YBQ9Q4hpzunmF29ih0Xjy-FopN0sM56ruNrdbCg';

function formatArgs(args) {
  return (args || []).map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') {
      return Number.isInteger(a) ? { type: 'integer', value: String(a) } : { type: 'float', value: a };
    }
    return { type: 'text', value: String(a) };
  });
}

function parseRows(cols, rows) {
  return (rows || []).map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      const cell = row[i];
      if (!cell || cell.type === 'null') {
        obj[col.name] = null;
      } else if (cell.type === 'integer' || cell.type === 'float') {
        obj[col.name] = Number(cell.value);
      } else {
        obj[col.name] = cell.value;
      }
    });
    return obj;
  });
}

async function query(sql, args = []) {
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: formatArgs(args) } }]
    })
  });
  const data = await res.json();
  if (!res.ok || !data.results) {
    const errMsg = data.error || data.message || `Turso HTTP ${res.status}: Periksa TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di Vercel`;
    throw new Error(errMsg);
  }
  const r = data.results[0];
  if (r.type === 'error') throw new Error(r.error.message);
  const result = r.response.result;
  return {
    rows: parseRows(result.cols, result.rows),
    rowsAffected: result.affected_row_count,
    lastInsertRowid: result.last_insert_rowid ? Number(result.last_insert_rowid) : null
  };
}

async function batch(statements) {
  const requests = statements.map(s => ({
    type: 'execute',
    stmt: { sql: s.sql, args: formatArgs(s.args || []) }
  }));
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });
  const data = await res.json();
  if (!res.ok || !data.results) {
    const errMsg = data.error || data.message || `Turso HTTP ${res.status}: Periksa TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di Vercel`;
    throw new Error(errMsg);
  }
  return data.results.map(r => {
    if (r.type === 'error') throw new Error(r.error.message);
    const result = r.response.result;
    return {
      rows: parseRows(result.cols, result.rows),
      rowsAffected: result.affected_row_count,
      lastInsertRowid: result.last_insert_rowid ? Number(result.last_insert_rowid) : null
    };
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getUserFromToken(token) {
  if (!token) return null;
  const res = await query(`
    SELECT u.id, u.username, u.name, u.role, u.avatar
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `, [token]);
  return res.rows[0] || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse Body
  let body = {};
  if (req.body) {
    body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
  } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const str = Buffer.concat(chunks).toString();
      body = str ? JSON.parse(str) : {};
    } catch (_) {
      body = {};
    }
  }

  // Parse Path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const subpath = parsedUrl.searchParams.get('subpath');
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || '';
  
  let rawPath = '';
  if (subpath) {
    rawPath = subpath.startsWith('/') ? subpath : '/' + subpath;
  } else if (forwardedUri && forwardedUri.startsWith('/api')) {
    rawPath = forwardedUri.replace(/^\/api/, '');
  } else {
    rawPath = parsedUrl.pathname.replace(/^\/api/, '');
  }
  const path = rawPath.replace(/^\/index\.js/, '') || '/';

  const queryParams = {};
  parsedUrl.searchParams.forEach((v, k) => {
    if (k !== 'subpath') queryParams[k] = v;
  });

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const method = req.method;

  try {
    // ========== HEALTH CHECK ==========
    if (path === '/' || path === '/health') {
      return res.status(200).json({ success: true, message: 'KasirPro API on Turso is running v2', timestamp: new Date().toISOString() });
    }

    // ========== DEBUG (TEMPORARY) ==========
    if (path === '/debug' && method === 'GET') {
      const dbUrl = process.env.TURSO_DATABASE_URL || 'NOT_SET';
      const hasToken = process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT_SET';
      const urlUsed = TURSO_URL;
      let dbTest = 'untested';
      try {
        const testRes = await fetch(TURSO_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${TURSO_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT COUNT(*) as cnt FROM users', args: [] } }] })
        });
        const testData = await testRes.json();
        dbTest = { status: testRes.status, hasResults: !!testData.results, raw: JSON.stringify(testData).slice(0, 200) };
      } catch(e) { dbTest = `error: ${e.message}`; }
      return res.status(200).json({ dbUrl, hasToken, urlUsed, dbTest });
    }

    // ========== AUTH ROUTES ==========
    if (path === '/auth/login' && method === 'POST') {
      const { username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
      }
      const usersRes = await query('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
      const user = usersRes.rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ success: false, error: 'Username atau password salah' });
      }

      const sessionToken = generateToken();
      await query(`
        INSERT INTO user_sessions (user_id, token, expires_at)
        VALUES (?, ?, datetime('now', '+7 days'))
      `, [user.id, sessionToken]);

      return res.status(200).json({
        success: true,
        message: `Selamat datang, ${user.name}!`,
        token: sessionToken,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, avatar: user.avatar }
      });
    }

    if (path === '/auth/logout' && method === 'POST') {
      if (token) {
        await query('DELETE FROM user_sessions WHERE token = ?', [token]);
      }
      return res.status(200).json({ success: true, message: 'Logout berhasil' });
    }

    if (path === '/auth/me' && method === 'GET') {
      const currentUser = await getUserFromToken(token);
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Sesi telah berakhir atau tidak valid' });
      }
      return res.status(200).json({ success: true, user: currentUser });
    }

    // ========== PRODUCTS ROUTES ==========
    if (path === '/products/meta/categories' && method === 'GET') {
      const result = await query('SELECT * FROM categories ORDER BY name ASC');
      return res.status(200).json({ success: true, data: result.rows });
    }

    if (path === '/products/meta/categories' && method === 'POST') {
      const { name, color } = body;
      if (!name) return res.status(400).json({ success: false, error: 'Nama kategori wajib diisi' });
      const ins = await query('INSERT INTO categories (name, color) VALUES (?, ?)', [name.trim(), color || '#6366f1']);
      const cat = await query('SELECT * FROM categories WHERE id = ?', [ins.lastInsertRowid]);
      return res.status(201).json({ success: true, data: cat.rows[0] });
    }

    if (path === '/products' && method === 'GET') {
      const { category_id, search, active } = queryParams;
      let sql = `
        SELECT p.*, c.name as category_name, c.color as category_color
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const args = [];
      if (active !== 'all') {
        sql += ' AND p.is_active = 1';
      }
      if (category_id && category_id !== 'all') {
        sql += ' AND p.category_id = ?';
        args.push(category_id);
      }
      if (search) {
        sql += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
        args.push(`%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY p.name ASC';

      const result = await query(sql, args);
      return res.status(200).json({ success: true, data: result.rows });
    }

    if (path === '/products' && method === 'POST') {
      const { name, price, cost_price = 0, reseller_price = 0, stock = 0, category_id, emoji = '📦', barcode, description } = body;
      if (!name || price === undefined) {
        return res.status(400).json({ success: false, error: 'Name and price are required' });
      }
      const ins = await query(`
        INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, price, cost_price || 0, reseller_price || 0, stock || 0, category_id || null, emoji || '📦', barcode || null, description || null]);
      const created = await query('SELECT * FROM products WHERE id = ?', [ins.lastInsertRowid]);
      return res.status(201).json({ success: true, data: created.rows[0] });
    }

    // Single product /products/:id or toggle-status / stock
    const productMatch = path.match(/^\/products\/(\d+)(\/(toggle-status|stock))?$/);
    if (productMatch) {
      const id = Number(productMatch[1]);
      const subAction = productMatch[3];

      if (subAction === 'toggle-status' && method === 'PATCH') {
        const prod = await query('SELECT * FROM products WHERE id = ?', [id]);
        if (!prod.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
        const newStatus = prod.rows[0].is_active ? 0 : 1;
        await query('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);
        const updated = await query('SELECT * FROM products WHERE id = ?', [id]);
        return res.status(200).json({ success: true, data: updated.rows[0] });
      }

      if (subAction === 'stock' && method === 'PATCH') {
        const { amount } = body;
        if (amount === undefined) return res.status(400).json({ success: false, error: 'Amount is required' });
        const prod = await query('SELECT * FROM products WHERE id = ?', [id]);
        if (!prod.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
        const newStock = Math.max(0, prod.rows[0].stock + Number(amount));
        await query('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, id]);
        const updated = await query('SELECT * FROM products WHERE id = ?', [id]);
        return res.status(200).json({ success: true, data: updated.rows[0] });
      }

      if (method === 'GET') {
        const result = await query(`
          SELECT p.*, c.name as category_name, c.color as category_color
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ?
        `, [id]);
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (method === 'PUT') {
        const { name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, description, is_active } = body;
        await query(`
          UPDATE products SET
            name = COALESCE(?, name),
            price = COALESCE(?, price),
            cost_price = COALESCE(?, cost_price),
            reseller_price = COALESCE(?, reseller_price),
            stock = COALESCE(?, stock),
            category_id = ?,
            emoji = COALESCE(?, emoji),
            barcode = ?,
            description = ?,
            is_active = COALESCE(?, is_active),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, price, cost_price, reseller_price, stock, category_id !== undefined ? category_id : null, emoji, barcode, description, is_active, id]);
        const updated = await query('SELECT * FROM products WHERE id = ?', [id]);
        return res.status(200).json({ success: true, data: updated.rows[0] });
      }

      if (method === 'DELETE') {
        await query('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        return res.status(200).json({ success: true, message: 'Product deactivated' });
      }
    }

    // ========== TRANSACTIONS ROUTES ==========
    if (path === '/transactions' && method === 'GET') {
      const { page = 1, limit = 20, start_date, end_date, payment_method, cashier_name, search } = queryParams;
      const offset = (Number(page) - 1) * Number(limit);
      let sql = 'SELECT * FROM transactions WHERE 1=1';
      const args = [];

      if (start_date) { sql += ' AND date(created_at) >= date(?)'; args.push(start_date); }
      if (end_date) { sql += ' AND date(created_at) <= date(?)'; args.push(end_date); }
      if (payment_method && payment_method !== 'all') { sql += ' AND payment_method = ?'; args.push(payment_method); }
      if (cashier_name) { sql += ' AND cashier_name = ?'; args.push(cashier_name); }
      if (search) {
        sql += ' AND (invoice_number LIKE ? OR recipient_name LIKE ? OR note LIKE ?)';
        args.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const queryArgs = [...args, Number(limit), Number(offset)];

      const result = await query(sql, queryArgs);
      const countRes = await query('SELECT COUNT(*) as total FROM transactions');
      return res.status(200).json({
        success: true,
        data: result.rows,
        pagination: { page: Number(page), limit: Number(limit), total: countRes.rows[0]?.total || 0 }
      });
    }

    if (path === '/transactions' && method === 'POST') {
      const {
        items,
        customer_type = 'regular',
        discount = 0,
        tax = 0,
        shipping_cost = 0,
        shipping_name,
        recipient_name,
        recipient_address,
        amount_paid,
        payment_method = 'cash',
        cashier_name = 'Admin',
        note
      } = body;

      if (!items || !items.length) return res.status(400).json({ success: false, error: 'Items required' });

      let total = 0;
      let total_cost = 0;
      items.forEach(item => {
        total += item.price * item.quantity;
        total_cost += (item.cost_price || 0) * item.quantity;
      });

      const grand_total = total - Number(discount) + Number(tax) + Number(shipping_cost);
      const profit = (total - Number(discount)) - total_cost;
      const change_amount = Math.max(0, Number(amount_paid) - grand_total);

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const countRes = await query("SELECT COUNT(*) as count FROM transactions WHERE date(created_at) = date('now')");
      const seq = String((countRes.rows[0]?.count || 0) + 1).padStart(4, '0');
      const invoice_number = `TRX-${dateStr}-${seq}`;

      const insertTrx = await query(`
        INSERT INTO transactions (
          invoice_number, customer_type, total, discount, tax, shipping_cost, shipping_name,
          recipient_name, recipient_address, grand_total, total_cost, profit, amount_paid,
          change_amount, payment_method, cashier_name, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoice_number, customer_type, total, discount, tax, shipping_cost, shipping_name || null,
        recipient_name || null, recipient_address || null, grand_total, total_cost, profit,
        amount_paid, change_amount, payment_method, cashier_name, note || null
      ]);

      const transactionId = insertTrx.lastInsertRowid;

      for (const item of items) {
        const itemSubtotal = item.price * item.quantity;
        const itemCost = (item.cost_price || 0) * item.quantity;
        const itemProfit = itemSubtotal - itemCost;
        await query(`
          INSERT INTO transaction_items (transaction_id, product_id, product_name, product_price, product_cost, quantity, subtotal, profit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [transactionId, item.id || null, item.name, item.price, item.cost_price || 0, item.quantity, itemSubtotal, itemProfit]);

        if (item.id) {
          await query('UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.quantity, item.id]);
        }
      }

      const finalTrx = await query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
      const finalItems = await query('SELECT * FROM transaction_items WHERE transaction_id = ?', [transactionId]);
      return res.status(201).json({ success: true, data: { ...finalTrx.rows[0], items: finalItems.rows } });
    }

    const trxMatch = path.match(/^\/transactions\/(\d+)$/);
    if (trxMatch) {
      const id = Number(trxMatch[1]);
      if (method === 'GET') {
        const trx = await query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!trx.rows.length) return res.status(404).json({ success: false, error: 'Transaction not found' });
        const items = await query('SELECT * FROM transaction_items WHERE transaction_id = ?', [id]);
        return res.status(200).json({ success: true, data: { ...trx.rows[0], items: items.rows } });
      }
      if (method === 'DELETE') {
        await query('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
        await query('DELETE FROM transactions WHERE id = ?', [id]);
        return res.status(200).json({ success: true, message: 'Transaction deleted' });
      }
    }

    // ========== DASHBOARD ROUTES ==========
    if (path === '/dashboard/summary' && method === 'GET') {
      const today = await query(`
        SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(profit), 0) as profit
        FROM transactions WHERE date(created_at) = date('now')
      `);
      const month = await query(`
        SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(profit), 0) as profit
        FROM transactions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `);
      const prodStats = await query(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock
        FROM products WHERE is_active = 1
      `);
      const topProducts = await query(`
        SELECT product_name as name, SUM(quantity) as total_sold, SUM(subtotal) as total_revenue
        FROM transaction_items
        GROUP BY product_id, product_name
        ORDER BY total_sold DESC LIMIT 5
      `);
      const last7Days = await query(`
        SELECT date(created_at) as date, COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as count
        FROM transactions
        WHERE date(created_at) >= date('now', '-6 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `);
      const recentTrx = await query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5');

      return res.status(200).json({
        success: true,
        data: {
          today: today.rows[0] || { count: 0, revenue: 0, profit: 0 },
          this_month: month.rows[0] || { count: 0, revenue: 0, profit: 0 },
          products: prodStats.rows[0] || { total: 0, low_stock: 0, out_of_stock: 0 },
          top_products: topProducts.rows,
          last_7_days: last7Days.rows,
          recent_transactions: recentTrx.rows
        }
      });
    }

    if (path === '/dashboard/chart' && method === 'GET') {
      const { period = '7days' } = queryParams;
      let sql = '';
      if (period === '30days') {
        sql = `
          SELECT date(created_at) as label, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(profit), 0) as profit, COUNT(*) as count
          FROM transactions WHERE date(created_at) >= date('now', '-29 days')
          GROUP BY date(created_at) ORDER BY label ASC
        `;
      } else if (period === '12months') {
        sql = `
          SELECT strftime('%Y-%m', created_at) as label, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(profit), 0) as profit, COUNT(*) as count
          FROM transactions WHERE date(created_at) >= date('now', '-11 months', 'start of month')
          GROUP BY strftime('%Y-%m', created_at) ORDER BY label ASC
        `;
      } else {
        sql = `
          SELECT date(created_at) as label, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(profit), 0) as profit, COUNT(*) as count
          FROM transactions WHERE date(created_at) >= date('now', '-6 days')
          GROUP BY date(created_at) ORDER BY label ASC
        `;
      }
      const result = await query(sql);
      return res.status(200).json({ success: true, data: result.rows });
    }

    return res.status(404).json({ success: false, error: `Route ${path} not found` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

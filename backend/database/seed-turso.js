/**
 * seed-turso.js
 * 
 * Script untuk inisialisasi database Turso baru (client/toko baru).
 * Tidak memerlukan library tambahan - hanya Node.js >= 18.
 * 
 * Cara penggunaan:
 *   $env:TURSO_DATABASE_URL="libsql://nama-db-user.aws-ap-northeast-1.turso.io"
 *   $env:TURSO_AUTH_TOKEN="token-auth-kamu"
 *   node backend/database/seed-turso.js
 */

const crypto = require('crypto');

// ── Ambil kredensial dari environment variable ──
const rawUrl = process.env.TURSO_DATABASE_URL;
const token  = process.env.TURSO_AUTH_TOKEN;

if (!rawUrl || !token) {
  console.error('❌ ERROR: TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN harus diset!');
  console.error('');
  console.error('Contoh (PowerShell):');
  console.error('  $env:TURSO_DATABASE_URL="libsql://kasir-toko2-xyz.aws-ap-northeast-1.turso.io"');
  console.error('  $env:TURSO_AUTH_TOKEN="eyJ..."');
  console.error('  node backend/database/seed-turso.js');
  process.exit(1);
}

const TURSO_URL = rawUrl
  .replace(/^libsql:\/\//, 'https://')
  .replace(/\/$/, '') + '/v2/pipeline';

console.log(`🔗 Connecting to: ${TURSO_URL.replace(/\/v2\/pipeline$/, '')}`);

// ── Helper Functions ──
function formatArgs(args) {
  return (args || []).map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') {
      return Number.isInteger(a)
        ? { type: 'integer', value: String(a) }
        : { type: 'float', value: a };
    }
    return { type: 'text', value: String(a) };
  });
}

function parseRows(cols, rows) {
  return (rows || []).map(row => {
    const obj = {};
    cols.forEach((col, i) => {
      const cell = row[i];
      if (!cell || cell.type === 'null') obj[col.name] = null;
      else if (cell.type === 'integer' || cell.type === 'float') obj[col.name] = Number(cell.value);
      else obj[col.name] = cell.value;
    });
    return obj;
  });
}

async function exec(sql, args = []) {
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: formatArgs(args) } }]
    })
  });
  const data = await res.json();
  const r = data.results[0];
  if (r.type === 'error') throw new Error(`SQL Error: ${r.error.message}\nSQL: ${sql}`);
  const result = r.response.result;
  return {
    rows: parseRows(result.cols, result.rows),
    rowsAffected: result.affected_row_count,
    lastInsertRowid: result.last_insert_rowid ? Number(result.last_insert_rowid) : null
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ── Main Seeder ──
async function seed() {
  console.log('\n🌱 Memulai proses seed database...\n');

  // ── 1. Buat Tabel ──
  console.log('📦 Membuat tabel...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      reseller_price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER,
      emoji TEXT DEFAULT '📦',
      barcode TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_type TEXT DEFAULT 'regular',
      total REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      shipping_name TEXT,
      recipient_name TEXT,
      recipient_address TEXT,
      grand_total REAL NOT NULL,
      total_cost REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      amount_paid REAL NOT NULL,
      change_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      cashier_name TEXT DEFAULT 'Admin',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      product_cost REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      profit REAL DEFAULT 0,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      avatar TEXT DEFAULT '👤',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of tables) {
    await exec(sql);
  }
  console.log('  ✅ Semua tabel berhasil dibuat');

  // ── 2. Seed Kategori ──
  const catCount = await exec('SELECT COUNT(*) as count FROM categories');
  if (catCount.rows[0].count === 0) {
    console.log('\n🏷️  Menambahkan kategori default...');
    const categories = [
      ['Makanan',    '#f59e0b'],
      ['Minuman',    '#06b6d4'],
      ['Snack',      '#ec4899'],
      ['Elektronik', '#8b5cf6'],
      ['Lainnya',    '#6b7280'],
    ];
    for (const [name, color] of categories) {
      await exec('INSERT INTO categories (name, color) VALUES (?, ?)', [name, color]);
    }
    console.log(`  ✅ ${categories.length} kategori ditambahkan`);
  } else {
    console.log('\n⏭️  Kategori sudah ada, dilewati');
  }

  // ── 3. Seed Produk ──
  const prodCount = await exec('SELECT COUNT(*) as count FROM products');
  if (prodCount.rows[0].count === 0) {
    console.log('\n🛒 Menambahkan produk contoh...');
    const catRes = await exec('SELECT id, name FROM categories ORDER BY id ASC');
    const cats = {};
    catRes.rows.forEach(c => { cats[c.name] = c.id; });

    const products = [
      ['Nasi Goreng',       15000, 8000,  50,  cats['Makanan'],    '🍳'],
      ['Mie Ayam',          12000, 6000,  40,  cats['Makanan'],    '🍜'],
      ['Ayam Bakar',        20000, 11000, 30,  cats['Makanan'],    '🍗'],
      ['Es Teh',             5000, 1500,  100, cats['Minuman'],    '🧋'],
      ['Kopi Hitam',         8000, 3000,  80,  cats['Minuman'],    '☕'],
      ['Jus Jeruk',         10000, 4000,  60,  cats['Minuman'],    '🍊'],
      ['Keripik Singkong',   7000, 3500,  150, cats['Snack'],      '🥨'],
      ['Coklat Wafer',       5000, 2500,  200, cats['Snack'],      '🍫'],
      ['Kacang Goreng',      8000, 4000,  100, cats['Snack'],      '🥜'],
    ];

    for (const [name, price, cost, stock, cat_id, emoji] of products) {
      await exec(
        'INSERT INTO products (name, price, cost_price, stock, category_id, emoji) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, cost, stock, cat_id, emoji]
      );
    }
    console.log(`  ✅ ${products.length} produk ditambahkan`);
  } else {
    console.log('\n⏭️  Produk sudah ada, dilewati');
  }

  // ── 4. Seed Users ──
  const userCount = await exec('SELECT COUNT(*) as count FROM users');
  if (userCount.rows[0].count === 0) {
    console.log('\n👤 Membuat akun default...');

    await exec(
      'INSERT INTO users (username, name, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'Administrator Toko', hashPassword('admin123'), 'admin', '👑']
    );
    await exec(
      'INSERT INTO users (username, name, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)',
      ['kasir', 'Kasir 1', hashPassword('kasir123'), 'cashier', '💼']
    );

    console.log('  ✅ Akun admin (admin/admin123) dibuat');
    console.log('  ✅ Akun kasir (kasir/kasir123) dibuat');
  } else {
    console.log('\n⏭️  Users sudah ada, dilewati');
  }

  // ── Selesai ──
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 SEED BERHASIL!');
  console.log('═'.repeat(50));
  console.log('\n📋 Akun yang tersedia:');
  console.log('   👑 Admin  → username: admin   | password: admin123');
  console.log('   💼 Kasir  → username: kasir   | password: kasir123');
  console.log('\n⚠️  Segera ganti password setelah login pertama!');
  console.log('');
}

seed().catch(err => {
  console.error('\n❌ SEED GAGAL:', err.message);
  process.exit(1);
});

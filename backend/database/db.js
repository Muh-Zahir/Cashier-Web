const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'kasir.db');
const shmPath = path.join(dbDir, 'kasir.db-shm');
const walPath = path.join(dbDir, 'kasir.db-wal');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ SQLite connected in WAL mode');
} catch (err) {
  console.warn('⚠️ WAL mode failed, attempting recovery:', err.message);
  try { if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath); } catch (_) {}
  try { if (fs.existsSync(walPath)) fs.unlinkSync(walPath); } catch (_) {}
  db = new Database(dbPath);
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');
  console.log('✅ SQLite connected in DELETE mode');
}

// ========== SCHEMA MIGRATION (CREATE IF NOT EXISTS) ==========
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
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
  );

  CREATE TABLE IF NOT EXISTS transactions (
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
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
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
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    avatar TEXT DEFAULT '👤',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ========== LIVE MIGRATION: add new columns to existing tables ==========
const alterIfNotExists = (sql) => {
  try { db.exec(sql); } catch (_) { /* column already exists, skip */ }
};

alterIfNotExists('ALTER TABLE products ADD COLUMN cost_price REAL NOT NULL DEFAULT 0');
alterIfNotExists('ALTER TABLE products ADD COLUMN reseller_price REAL NOT NULL DEFAULT 0');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN customer_type TEXT DEFAULT \'regular\'');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN shipping_cost REAL DEFAULT 0');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN shipping_name TEXT');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN recipient_name TEXT');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN recipient_address TEXT');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN total_cost REAL DEFAULT 0');
alterIfNotExists('ALTER TABLE transactions ADD COLUMN profit REAL DEFAULT 0');
alterIfNotExists('ALTER TABLE transaction_items ADD COLUMN product_cost REAL NOT NULL DEFAULT 0');
alterIfNotExists('ALTER TABLE transaction_items ADD COLUMN profit REAL DEFAULT 0');

// ========== SEED DEFAULT DATA ==========
const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (categoriesCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
  const categories = [
    ['Broco Standard', '#3b82f6'],
    ['Broco Multi Gang', '#8b5cf6'],
    ['Broco MCB & Box', '#f59e0b'],
    ['Broco Atlantic', '#06b6d4'],
    ['Broco Gracio', '#10b981'],
    ['Broco Galleo', '#ec4899'],
    ['Uticon Series', '#6366f1'],
    ['Kabel Eterna', '#ef4444'],
    ['Panasonic Series', '#14b8a6'],
  ];
  categories.forEach(([name, color]) => insertCategory.run(name, color));

  const insertProduct = db.prepare(`
    INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const products = [
    ['Fitting Plafon', 10000, 5136, 6436, 50, 1, '💡', '210L', 1],
    ['Fitting Gantung', 10000, 4976, 5976, 50, 1, '💡', '216L', 1],
    ['Fitting Kombinasi', 16000, 9360, 10360, 50, 1, '💡', '226', 1],
    ['Fitting Plafon Besar', 18000, 10016, 12410, 50, 1, '💡', '1210', 1],
    ['Saklar Engkel New Gee Urea', 20000, 12211, 15376, 50, 1, '🔘', '6621U', 1],
    ['Saklar Seri New Gee Urea', 28000, 16595, 19576, 50, 1, '🔘', '6622U', 1],
    ['Stop Kontak Arde Outbow Persegi Cream', 20000, 13714, 15895, 50, 1, '🔌', '1541011', 1],
    ['Steker Biasa', 10000, 3560, 4556, 50, 1, '🔌', '344 L', 1],
    ['STOP KONTAK UTICON 1 LBNG', 13000, 7020, 8520, 50, 7, '🔌', 'ST-181', 1],
    ['STOP KONTAK UTICON 3 LBNG', 25000, 15776, 17740, 50, 7, '🔌', 'ST-183', 1],
  ];
  products.forEach(([name, price, cost_price, reseller_price, stock, cat, emoji, barcode, is_active]) =>
    insertProduct.run(name, price, cost_price, reseller_price, stock, cat, emoji, barcode, is_active)
  );
}

// ========== SEED DEFAULT USERS ==========
try {
  const { hashPassword } = require('../utils/auth');
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (usersCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, password_hash, role, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', 'Administrator Toko', hashPassword('admin123'), 'admin', '👑');
    insertUser.run('kasir', 'Kasir 1', hashPassword('kasir123'), 'cashier', '💼');
    console.log('✅ Default users created: admin and kasir');
  }
} catch (e) {
  console.error('Error seeding users:', e.message);
}

module.exports = db;

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'kasir.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
    ['Makanan', '#f59e0b'],
    ['Minuman', '#06b6d4'],
    ['Snack', '#ec4899'],
    ['Elektronik', '#8b5cf6'],
    ['Lainnya', '#6b7280'],
  ];
  categories.forEach(([name, color]) => insertCategory.run(name, color));

  const insertProduct = db.prepare(`
    INSERT INTO products (name, price, cost_price, stock, category_id, emoji) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const products = [
    ['Nasi Goreng',      15000, 8000,  50,  1, '🍳'],
    ['Mie Ayam',         12000, 6000,  40,  1, '🍜'],
    ['Ayam Bakar',       20000, 11000, 30,  1, '🍗'],
    ['Es Teh',            5000, 1500,  100, 2, '🧋'],
    ['Kopi Hitam',        8000, 3000,  80,  2, '☕'],
    ['Jus Jeruk',        10000, 4000,  60,  2, '🍊'],
    ['Keripik Singkong',  7000, 3500,  150, 3, '🥨'],
    ['Coklat Wafer',      5000, 2500,  200, 3, '🍫'],
    ['Kacang Goreng',     8000, 4000,  100, 3, '🥜'],
  ];
  products.forEach(([name, price, cost_price, stock, cat, emoji]) =>
    insertProduct.run(name, price, cost_price, stock, cat, emoji)
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

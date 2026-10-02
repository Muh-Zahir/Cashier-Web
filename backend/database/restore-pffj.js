/**
 * Restore PFFJ database
 */

const rawUrl = 'https://kasir-db-muh-zahir.aws-ap-northeast-1.turso.io/v2/pipeline';
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk1NDU5MzAsImlkIjoiMDFhMGE5M2YtMjUwMS03NWQyLWI3MWEtODg5YzJiMmViYTM3Iiwia2lkIjoiQVRyQkVNTEMzX2R2ajRjdXY1Qm5KRnkxdG5EaWk4SlA5QS1ENGFWNjhNayIsInJpZCI6IjJmOGUwODIwLTY5NmMtNGI2My1hMjFjLWZkYzQ1NDhiNjNjMCJ9.hAtq7Qr6_dF5-tiaQsSWCLmg0EWTcCpr9gLOwKecMW4SnV2YBQ9Q4hpzunmF29ih0Xjy-FopN0sM56ruNrdbCg';

function formatArgs(args) {
  return (args || []).map(a => {
    if (a === null || a === undefined) return { type: 'null' };
    if (typeof a === 'number') {
      return Number.isInteger(a) ? { type: 'integer', value: String(a) } : { type: 'float', value: a };
    }
    return { type: 'text', value: String(a) };
  });
}

async function executeStatements(stmts) {
  const requests = stmts.map(s => ({
    type: 'execute',
    stmt: { sql: s.sql, args: formatArgs(s.args || []) }
  }));

  const res = await fetch(rawUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  const data = await res.json();
  if (!res.ok || !data.results) {
    throw new Error(JSON.stringify(data));
  }
  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    if (r.type === 'error') {
      throw new Error(`Statement ${i} failed: ${r.error.message}`);
    }
  }
  return data.results;
}

const CATEGORIES = [
  { id: 1, name: 'Makanan', color: '#f59e0b' },
  { id: 2, name: 'Minuman', color: '#06b6d4' },
  { id: 3, name: 'Snack', color: '#ec4899' },
  { id: 4, name: 'Elektronik', color: '#8b5cf6' },
  { id: 5, name: 'Lainnya', color: '#6b7280' },
];

const PRODUCTS = [
  ['Nasi Goreng', 15000, 8000, 13000, 50, 1, '🍳', 'FD-001'],
  ['Mie Ayam', 12000, 6000, 10000, 40, 1, '🍜', 'FD-002'],
  ['Ayam Bakar', 20000, 11000, 18000, 30, 1, '🍗', 'FD-003'],
  ['Es Teh', 5000, 1500, 4000, 100, 2, '🧋', 'DR-001'],
  ['Kopi Hitam', 8000, 3000, 7000, 80, 2, '☕', 'DR-002'],
  ['Jus Jeruk', 10000, 4000, 8500, 60, 2, '🍊', 'DR-003'],
  ['Kopi Susu Gula Aren', 12000, 5000, 10000, 50, 2, '☕', 'DR-004'],
  ['Keripik Singkong', 7000, 3500, 6000, 150, 3, '🥨', 'SN-001'],
  ['Coklat Wafer', 5000, 2500, 4000, 200, 3, '🍫', 'SN-002'],
  ['Kacang Goreng', 8000, 4000, 7000, 100, 3, '🥜', 'SN-003'],
];

async function run() {
  console.log('🔄 Mengembalikan kategori dan produk PFFJ...');
  await executeStatements([
    { sql: 'DELETE FROM products' },
    { sql: 'DELETE FROM categories' },
  ]);

  const catStmts = CATEGORIES.map(c => ({
    sql: 'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
    args: [c.id, c.name, c.color]
  }));
  await executeStatements(catStmts);

  const prodStmts = PRODUCTS.map(([name, price, cost_price, reseller_price, stock, cat_id, emoji, barcode]) => ({
    sql: `INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    args: [name, price, cost_price, reseller_price, stock, cat_id, emoji, barcode]
  }));
  await executeStatements(prodStmts);

  console.log('✅ Berhasil mengembalikan data PFFJ!');
}

run().catch(console.error);

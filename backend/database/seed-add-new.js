/**
 * Script TAMBAH DATA BARU — tanpa menghapus data yang sudah ada.
 * Menambahkan 3 kelompok produk baru:
 *   - Cat 10: Shimura & VDR (lampu LED, bracket, downlight)
 *   - Cat 11: Stop Kontak + Kabel
 *   - Cat 12: Clam / Klem
 */

const rawUrl = 'https://kasir-db-plm-muh-zahir.aws-ap-northeast-1.turso.io/v2/pipeline';
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA5MjM0NjgsImlkIjoiMDFhMGZiNWEtZDgwMS03ZTM1LWI3MTYtNjdmOTlhYTljMzkyIiwia2lkIjoiQVRyQkVNTEMzX2R2ajRjdXY1Qm5KRnkxdG5EaWk4SlA5QS1ENGFWNjhNayIsInJpZCI6IjkyMDlmZmY3LWIwZDUtNDUyMC05YzQ0LTI2MzkwYmFhZGI3MiJ9.SMqrsBsb9ySA8J4xFDZUQs1lyRO-1lt2CVXPxCmAelTM-GcQMlFQJLYy5-FmCWbNcCM5mIWH_RQsSrIEIQRnCw';

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
      throw new Error(`Statement ${i} failed: ${r.error.message} (SQL: ${stmts[i].sql})`);
    }
  }
  return data.results;
}

// Kategori baru (id lanjutan dari yang sudah ada: 10, 11, 12)
const NEW_CATEGORIES = [
  { id: 10, name: 'Shimura & VDR',       color: '#f97316' },
  { id: 11, name: 'Stop Kontak Kabel',   color: '#0ea5e9' },
  { id: 12, name: 'Clam / Klem',         color: '#84cc16' },
];

// Format: [barcode, name, cost_price (modal), reseller_price (supplier), price (toko), category_id, emoji]
const NEW_PRODUCTS = [

  // ========================
  // Cat 10 — Shimura & VDR
  // ========================
  [null, 'Shimura 5 Watt',          8925,   9925,  0,  10, '💡'],
  [null, 'Shimura 7 Watt',         12850,  13850,  0,  10, '💡'],
  [null, 'Shimura 9 Watt',         13875,  14875,  0,  10, '💡'],
  [null, 'Shimura 12 Watt',        15875,  17875,  0,  10, '💡'],
  [null, 'Shimura 15 Watt',        17655,  19655,  0,  10, '💡'],
  [null, 'Shimura 18 Watt',        22550,  24550,  0,  10, '💡'],
  [null, 'Shimura 21 Watt',        26876,  28876,  0,  10, '💡'],
  [null, 'Shimura 25 Watt',        36741,  38741,  0,  10, '💡'],

  [null, 'Bracket 10-42',              0,      0,  0,  10, '🔩'],
  [null, 'Bracket 24-65',              0,      0,  0,  10, '🔩'],
  [null, 'Bracket 10-32',              0,      0,  0,  10, '🔩'],

  [null, 'Lampu Belajar VDR 3016',     0,      0,  0,  10, '💡'],
  [null, 'LED VDR 3 Watt Kuning',      0,      0,  0,  10, '💡'],
  [null, 'Lampu Belajar VDR 3015',     0,      0,  0,  10, '💡'],
  [null, 'LED VDR 5 Watt Kuning',      0,      0,  0,  10, '💡'],
  [null, 'LED VDR 11 Watt Kuning',     0,      0,  0,  10, '💡'],
  [null, 'Downlight VDR 6 Watt IB',   0,      0,  0,  10, '💡'],
  [null, 'Downlight VDR 12 Watt IB',  0,      0,  0,  10, '💡'],
  [null, 'Downlight VDR 18 Watt OB',  0,      0,  0,  10, '💡'],
  [null, 'Downlight VDR 18 Watt IB',  0,      0,  0,  10, '💡'],
  [null, 'Downlight VDR 6 Watt OB',   0,      0,  0,  10, '💡'],

  // ========================
  // Cat 11 — Stop Kontak + Kabel
  // ========================
  [null, 'Stop Kontak 2 LB + 1,5m',  18700,  20700,  25000, 11, '🔌'],
  [null, 'Stop Kontak 2 LB + 3m',    23377,  25337,  30000, 11, '🔌'],
  [null, 'Stop Kontak 2 LB + 5m',    28050,  30050,  35000, 11, '🔌'],
  [null, 'Stop Kontak 3 LB + 1,5m',  19550,  21550,  30000, 11, '🔌'],
  [null, 'Stop Kontak 3 LB + 3m',    24225,  26540,  35000, 11, '🔌'],
  [null, 'Stop Kontak 3 LB + 5m',    29325,  32325,  40000, 11, '🔌'],
  [null, 'Stop Kontak 4 LB + 1,5m',  22950,  25950,  33000, 11, '🔌'],
  [null, 'Stop Kontak 4 LB + 3m',    25925,  27925,  40000, 11, '🔌'],
  [null, 'Stop Kontak 4 LB + 5m',    31025,  33825,  45000, 11, '🔌'],
  [null, 'Stop Kontak 5 LB + 1,5m',  24225,  27225,  35000, 11, '🔌'],
  [null, 'Stop Kontak 5 LB + 3m',    28475,  31475,  43000, 11, '🔌'],
  [null, 'Stop Kontak 5 LB + 5m',    33150,  37150,  50000, 11, '🔌'],

  // ========================
  // Cat 12 — Clam / Klem
  // ========================
  [null, 'Clam No 4',    4718,  5718,   8000, 12, '🔧'],
  [null, 'Clam No 5',    4930,  5930,   9000, 12, '🔧'],
  [null, 'Clam No 6',    5695,  6695,  10000, 12, '🔧'],
  [null, 'Clam No 7',    6633,  7333,  12000, 12, '🔧'],
  [null, 'Clam No 8',    7055,  8875,  13000, 12, '🔧'],
  [null, 'Clam No 9',    8925,  9925,  15000, 12, '🔧'],
  [null, 'Clam No 10',   9563, 10875,  18000, 12, '🔧'],
  [null, 'Clam No 12',  11688, 12988,  19000, 12, '🔧'],
  [null, 'Clam No 14',  15009, 17403,  25000, 12, '🔧'],
  [null, 'Clam No 16',  19975, 21975,      0, 12, '🔧'],
  [null, 'Clam No 18',  25203, 27203,      0, 12, '🔧'],
  [null, 'Clam No 20',  29325, 32325,      0, 12, '🔧'],
  [null, 'Clam No 22',  36083, 39083,      0, 12, '🔧'],
  [null, 'Clam No 25',  42925, 45925,      0, 12, '🔧'],
  [null, 'Clam No 30',  45050, 48950,      0, 12, '🔧'],
  [null, 'Clam No 32',  49215, 54215,      0, 12, '🔧'],
  [null, 'Clam No 35',  59160, 65515,      0, 12, '🔧'],
  [null, 'Clam No 40',  69700, 74700,      0, 12, '🔧'],
];

async function run() {
  // 1. Tambah kategori baru (INSERT OR IGNORE agar aman jika sudah ada)
  console.log('📁 Menambahkan kategori baru...');
  const catStmts = NEW_CATEGORIES.map(c => ({
    sql: 'INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)',
    args: [c.id, c.name, c.color]
  }));
  await executeStatements(catStmts);
  console.log(`  ✓ ${NEW_CATEGORIES.length} kategori ditambahkan`);

  // 2. Tambah produk baru dalam batch 20
  console.log(`\n⚡ Menambahkan ${NEW_PRODUCTS.length} produk baru...`);
  for (let i = 0; i < NEW_PRODUCTS.length; i += 20) {
    const batch = NEW_PRODUCTS.slice(i, i + 20);
    const prodStmts = batch.map(([barcode, name, cost_price, reseller_price, price, cat_id, emoji]) => {
      const effectivePrice = price > 0 ? price : (reseller_price > 0 ? reseller_price : 0);
      const stock = effectivePrice > 0 ? 50 : 0;
      const isActive = effectivePrice > 0 ? 1 : 0;

      return {
        sql: `INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [name, effectivePrice, cost_price, reseller_price, stock, cat_id, emoji, barcode, isActive]
      };
    });
    await executeStatements(prodStmts);
    console.log(`  ✓ Batch ${Math.floor(i / 20) + 1}/${Math.ceil(NEW_PRODUCTS.length / 20)} (${Math.min(i + 20, NEW_PRODUCTS.length)} dari ${NEW_PRODUCTS.length})`);
  }

  console.log('\n✅ Berhasil menambahkan semua data baru!');
  console.log('   Kategori: Shimura & VDR | Stop Kontak Kabel | Clam / Klem');
  console.log(`   Total produk: ${NEW_PRODUCTS.length}`);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

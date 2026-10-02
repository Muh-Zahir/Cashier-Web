/**
 * Script untuk menghapus data dummy lama (makanan/minuman)
 * dan memasukkan data katalog elektronik Broco, Uticon, Eterna, Panasonic untuk PLM.
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

const CATEGORIES = [
  { id: 1, name: 'Broco Standard', color: '#3b82f6' },
  { id: 2, name: 'Broco Multi Gang', color: '#8b5cf6' },
  { id: 3, name: 'Broco MCB & Box', color: '#f59e0b' },
  { id: 4, name: 'Broco Atlantic', color: '#06b6d4' },
  { id: 5, name: 'Broco Gracio', color: '#10b981' },
  { id: 6, name: 'Broco Galleo', color: '#ec4899' },
  { id: 7, name: 'Uticon Series', color: '#6366f1' },
  { id: 8, name: 'Kabel Eterna', color: '#ef4444' },
  { id: 9, name: 'Panasonic Series', color: '#14b8a6' },
];

// barcode, name, cost_price (modal), reseller_price (supplier), price (toko), category_id, emoji
const PRODUCTS = [
  // --- Broco Standard (Cat 1) ---
  ['210L', 'Fitting Plafon', 5136, 6436, 10000, 1, '💡'],
  ['216L', 'Fitting Gantung', 4976, 5976, 10000, 1, '💡'],
  ['226', 'Fitting Kombinasi', 9360, 10360, 16000, 1, '💡'],
  ['1210', 'Fitting Plafon Besar', 10016, 12410, 18000, 1, '💡'],
  ['1211', 'Fitting Plafon Besar New', 10263, 12980, 18000, 1, '💡'],
  ['1212', 'Fitting Plafon Bulat', 10016, 12410, 18000, 1, '💡'],
  ['1212-55', 'Fitting Plafon Bulat Putih', 10016, 12410, 18000, 1, '💡'],
  ['6621U', 'Saklar Engkel New Gee Urea', 12211, 15376, 20000, 1, '🔘'],
  ['6622U', 'Saklar Seri New Gee Urea', 16595, 19576, 28000, 1, '🔘'],
  ['6613', 'Saklar Triple IB', 22042, 25042, 35000, 1, '🔘'],
  ['1621011', 'Saklar Engkel Outbow Persegi Cream', 12362, 15376, 20000, 1, '🔘'],
  ['1622011', 'Saklar Seri Outbow Persegi Cream', 17138, 19439, 25000, 1, '🔘'],
  ['1541011', 'Stop Kontak Arde Outbow Persegi Cream', 13714, 15895, 20000, 1, '🔌'],
  ['1541111', 'Socket Outlet and Single Switch Outbow Cream', 19991, 23991, 35000, 1, '🔌'],
  ['1542011', 'Double Stop Kontak Arde Outbow Cream', 28991, 32991, 45000, 1, '🔌'],
  ['5511U', 'Stop Kontak Arde IB New Gee Urea', 13604, 16876, 20000, 1, '🔌'],
  ['344 L', 'Steker Biasa', 3560, 4556, 10000, 1, '🔌'],
  ['1331055', 'Steker Arde New Gee White', 10345, 13582, 18000, 1, '🔌'],
  ['1331165', 'Steker Saklar dgn Lampu White + Dark Grey', 21754, 25670, 35000, 1, '🔌'],
  ['1331255', 'Steker Arde New Gee White L Type', 10345, 25670, 18000, 1, '🔌'],
  ['13830-55', 'Steker T Arde Persegi White', 22076, 26044, 35000, 1, '🔌'],
  ['13840', 'Four Way Adapter Plug With Earth', 37586, 40586, 52000, 1, '🔌'],
  ['334 LN', 'Kontra Steker Biasa', 3936, 4951, 10000, 1, '🔌'],
  ['1341055', 'Kontra Steker Arde', 11512, 13582, 18000, 1, '🔌'],
  ['1391055', 'Over Steker Universal', 21273, 0, 30000, 1, '🔌'],
  ['517111', 'Telephone Socket New Gee Cream', 0, 0, 0, 1, '📞'],
  ['518111', 'TV Socket New Gee Cream', 0, 0, 0, 1, '📺'],
  ['525161-11', 'Socket Outlet and Single Switch NG Cream', 21802, 0, 35000, 1, '🔌'],
  ['525361-11', 'Universal Socket Outlet and Single Switch NG Cream', 21273, 0, 35000, 1, '🔌'],
  ['7110', 'Steker AC Arde', 21263, 0, 30000, 1, '🔌'],
  ['7110-55', 'Steker AC Arde Putih', 0, 0, 30000, 1, '🔌'],
  ['2301', 'Stop Kontak AC Arde IB', 0, 0, 0, 1, '🔌'],
  ['2100', 'Outbow Doos AC', 0, 0, 0, 1, '📦'],
  ['SET', 'AC Set Komplit Outbow', 0, 0, 0, 1, '📦'],
  ['B101', 'inbowdoss', 0, 2318, 4000, 1, '📦'],

  // --- Broco Multi Gang (Cat 2) ---
  ['15310', 'Stop Kontak 1 Lubang ( Non Child Protection )', 0, 0, 0, 2, '🔌'],
  ['1532155NCP', 'Stop Kontak 2 Lubang ( Non Child Protection )', 0, 36142, 0, 2, '🔌'],
  ['1533055NCP', 'Stop Kontak 3 Lubang ( Non Child Protection )', 0, 39989, 0, 2, '🔌'],
  ['1534055NCP', 'Stop Kontak 4 Lubang ( Non Child Protection )', 0, 53652, 0, 2, '🔌'],
  ['1535055CP', 'Stop Kontak 5 Lubang ( Child Protection )', 0, 60178, 0, 2, '🔌'],
  ['1536055NCP', 'Stop Kontak 6 Lubang ( Non Child Protection )', 0, 67796, 0, 2, '🔌'],

  // --- Broco MCB & Box (Cat 3) ---
  ['17302C', 'MCB C 2A', 0, 46503, 0, 3, '⚡'],
  ['17304C', 'MCB C 4A', 0, 45696, 0, 3, '⚡'],
  ['17306C', 'MCB C 6A', 0, 45696, 0, 3, '⚡'],
  ['17310C', 'MCB C 10A', 0, 45696, 0, 3, '⚡'],
  ['17316C', 'MCB C 16A', 0, 45696, 0, 3, '⚡'],
  ['17320C', 'MCB C 20A', 0, 46815, 0, 3, '⚡'],
  ['17325C', 'MCB C 25A', 0, 47469, 0, 3, '⚡'],
  ['17332C', 'MCB C 32A', 0, 48896, 0, 3, '⚡'],
  ['17340C', 'MCB C 40A', 0, 48896, 0, 3, '⚡'],
  ['17101', 'BOX MCB 1 GROUP OPBOW', 0, 0, 0, 3, '📦'],
  ['17102', 'BOX MCB 2 GROUP OPBOW', 0, 0, 0, 3, '📦'],
  ['17204', 'BOX MCB 4 GROUP OPBOW', 0, 0, 0, 3, '📦'],
  ['17104-50', 'BOX MCB 4 GROUP INBOW', 0, 0, 0, 3, '📦'],
  ['17108-50', 'BOX MCB 8 GROUP INBOW', 0, 0, 0, 3, '📦'],
  ['17112-50', 'BOX MCB 12 GROUP INBOW', 0, 0, 0, 3, '📦'],

  // --- Broco Atlantic (Cat 4) ---
  ['2161', 'SAKLAR ENGKEL ATLANTIC', 0, 0, 0, 4, '🔘'],
  ['2162', 'SAKLAR SERI ATLANTIC', 0, 0, 0, 4, '🔘'],
  ['2163', 'SAKLAR ENGKEL HOTEL ATLANTIC', 0, 0, 0, 4, '🔘'],
  ['2151', 'STOP KONTAK ATLANTIC', 0, 0, 0, 4, '🔌'],
  ['2165', 'SINGLE PUSH BUTTON ATLANTIC', 0, 0, 0, 4, '🔘'],
  ['225151', 'STOP KONTAK 2 GANG (VERTICAL) ATLANTIC', 0, 0, 0, 4, '🔌'],

  // --- Broco Gracio Series (Cat 5) ---
  ['4161-11', 'SAKLAR ENGKEL GRACIO', 0, 0, 0, 5, '🔘'],
  ['4162-11', 'SAKLAR SERI GRACIO', 0, 0, 0, 5, '🔘'],
  ['4151-11', 'STOP KONTAK GRACIO', 0, 0, 0, 5, '🔌'],
  ['4163-11', 'SAKLAR ENGKEL HOTEL GRACIO', 0, 0, 0, 5, '🔘'],
  ['4183-11', 'TV SOCKET GRACIO', 0, 0, 0, 5, '📺'],
  ['4171-11', 'TELEPHONE WALL SOCKET GRACIO', 0, 0, 0, 5, '📞'],
  [null, 'AC SET BSI STANDARD INBOW GRACIO', 0, 0, 0, 5, '📦'],
  [null, 'AC SET BSI STANDARD OPBOW GRACIO', 0, 0, 0, 5, '📦'],
  ['12101', 'FITTING PLAFOND BESAR LUX GRACIO', 28531, 30530, 0, 5, '💡'],

  // --- Broco Galleo Series (Cat 6) ---
  ['G161-55S', 'SAKLAR ENGKEL GALLEO', 0, 15054, 23000, 6, '🔘'],
  ['G162-55S', 'SAKLAR SERI GALLEO', 0, 21666, 30000, 6, '🔘'],
  ['G151-55S', 'STOP KONTAK GALLEO', 0, 15955, 23000, 6, '🔌'],
  [null, 'AC SET BSI STANDARD OPBOW GALLEO', 0, 68910, 85000, 6, '📦'],

  // --- Uticon Series (Cat 7) ---
  ['ST-181', 'STOP KONTAK UTICON 1 LBNG', 7020, 8520, 13000, 7, '🔌'],
  ['ST-182', 'STOP KONTAK UTICON 2 LBNG', 10725, 12918, 20000, 7, '🔌'],
  ['ST-183', 'STOP KONTAK UTICON 3 LBNG', 15776, 17740, 25000, 7, '🔌'],
  ['ST-184', 'STOP KONTAK UTICON 4 LBNG', 20475, 22716, 33000, 7, '🔌'],
  ['ST-185', 'STOP KONTAK UTICON 5 LBNG', 25155, 29477, 40000, 7, '🔌'],
  ['ST-186', 'STOP KONTAK UTICON 6 LBNG', 29835, 32517, 45000, 7, '🔌'],
  [null, 'kabel roll 10m uticon', 0, 248025, 0, 7, '🔌'],
  [null, 'kabel roll 15m uticon', 0, 0, 0, 7, '🔌'],
  [null, 'T arde uticon sc-382', 0, 36875, 0, 7, '🔌'],
  [null, 'stop kontak 2 lbng saklar s-128sw', 0, 53785, 0, 7, '🔌'],
  [null, 'stop kontak 3 lbng saklar s-138sw', 0, 75030, 0, 7, '🔌'],
  [null, 'stop kontak uticon 3 +saklar penuh', 0, 103700, 0, 7, '🔌'],
  [null, 'stop kontak 4 lb uticon 4+saklar penuh', 0, 129112, 0, 7, '🔌'],
  [null, 'stop kontak uticon 3+sw', 0, 0, 0, 7, '🔌'],
  [null, 'stop kontak uticon 4+sw', 0, 0, 0, 7, '🔌'],
  [null, 'stop kontak uticon 4+sw st 1468', 0, 0, 0, 7, '🔌'],
  [null, 'stop kontak uticon 5 lb+sw', 0, 0, 0, 7, '🔌'],
  [null, 'stop kontak uticon 6 lb+sw', 0, 0, 0, 7, '🔌'],

  // --- Kabel Eterna (Cat 8) ---
  [null, 'eterna 2x0,75@50m', 0, 0, 462672, 8, '〰️'],
  [null, 'eterna 2x1,5@50m', 0, 0, 663390, 8, '〰️'],
  [null, 'eterna 2x2,5@50m', 0, 0, 946890, 8, '〰️'],
  [null, 'eterna 3x1,5@50m', 0, 0, 852768, 8, '〰️'],
  [null, 'eterna 3x2,5@50m', 0, 0, 1231524, 8, '〰️'],

  // --- Panasonic Series (Cat 9) ---
  [null, 'stop kontak panasonic ib putih', 0, 0, 0, 9, '🔌'],
  [null, 'saklar engkel panasonic ib', 0, 0, 0, 9, '🔘'],
  [null, 'saklar seri panasonic ib', 0, 0, 0, 9, '🔘'],
  [null, 'stop kontak panasonic double', 0, 0, 0, 9, '🔌'],
  [null, 'stop kontak + saklar engkel panasonic', 0, 0, 0, 9, '🔌'],
  [null, 'stop kontak + saklar seri panasonic', 0, 0, 0, 9, '🔌'],
  [null, 'inbowdos panasonic', 0, 0, 0, 9, '📦'],
];

async function run() {
  console.log('🔄 Menghapus transaksi dan data dummy lama...');
  await executeStatements([
    { sql: 'DELETE FROM transaction_items' },
    { sql: 'DELETE FROM transactions' },
    { sql: 'DELETE FROM products' },
    { sql: 'DELETE FROM categories' },
  ]);

  console.log('📦 Memasukkan kategori elektronik...');
  const catStmts = CATEGORIES.map(c => ({
    sql: 'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
    args: [c.id, c.name, c.color]
  }));
  await executeStatements(catStmts);

  console.log(`⚡ Memasukkan ${PRODUCTS.length} produk katalog PLM...`);
  // Insert in batches of 20
  for (let i = 0; i < PRODUCTS.length; i += 20) {
    const batch = PRODUCTS.slice(i, i + 20);
    const prodStmts = batch.map(([barcode, name, cost_price, reseller_price, price, cat_id, emoji]) => {
      // Default stock 50 for items with price/supplier price, so they can be sold right away.
      // If no price yet, stock = 0, is_active = 1
      const effectivePrice = price > 0 ? price : (reseller_price > 0 ? reseller_price : 0);
      const stock = effectivePrice > 0 ? 50 : 0;
      const isActive = effectivePrice > 0 ? 1 : 0; // if price is 0, inactive until updated

      return {
        sql: `INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [name, effectivePrice, cost_price, reseller_price, stock, cat_id, emoji, barcode, isActive]
      };
    });
    await executeStatements(prodStmts);
    console.log(`  ✓ Inserted batch ${Math.floor(i / 20) + 1}/${Math.ceil(PRODUCTS.length / 20)}`);
  }

  console.log('✅ Berhasil memasukkan seluruh data produk PLM!');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

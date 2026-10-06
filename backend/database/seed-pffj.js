/**
 * Script SEED PRODUK KASIR PFFJ (Daftar Produk PFJA)
 * Memasukkan 10 Kategori dan 252 Produk lengkap dari Daftar Produk PFJA
 * Harga dan stok diset ke 0 agar mudah diedit/diisi langsung di web.
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
      throw new Error(`Statement ${i} failed: ${r.error.message} (SQL: ${stmts[i].sql})`);
    }
  }
  return data.results;
}

const CATEGORIES = [
  { id: 1,  name: 'Nugget & Olahan Ayam',     color: '#f59e0b' },
  { id: 2,  name: 'Daging Sapi & Segar',      color: '#ef4444' },
  { id: 3,  name: 'Seafood & Ikan',           color: '#06b6d4' },
  { id: 4,  name: 'Bakso & Sosis',            color: '#8b5cf6' },
  { id: 5,  name: 'Dimsum & Cemilan Beku',    color: '#10b981' },
  { id: 6,  name: 'Kentang & Olahan Singkong',color: '#eab308' },
  { id: 7,  name: 'Buah & Sayur Segar',       color: '#14b8a6' },
  { id: 8,  name: 'Susu, Keju & Dairy',       color: '#38bdf8' },
  { id: 9,  name: 'Snack, Coklat & Selai',    color: '#ec4899' },
  { id: 10, name: 'Minuman & Lainnya',        color: '#64748b' },
];

// Format: [name, category_id, emoji, barcode]
const PRODUCTS = [
  // Page 1 (1 - 28)
  ['Abon Karwati', 10, '🥩', 'PFJ-001'],
  ['Akumo Chicken Nugget 250g', 1, '🍗', 'PFJ-002'],
  ['Akumo Chicken Nugget 500g', 1, '🍗', 'PFJ-003'],
  ['Akumo Chicken Nugget 1000g', 1, '🍗', 'PFJ-004'],
  ['Almond Milk 250ml', 8, '🥛', 'PFJ-005'],
  ['Anchor Butter 227g', 8, '🧈', 'PFJ-006'],
  ['Anggur Autumn', 7, '🍇', 'PFJ-007'],
  ['Anggur Crimson', 7, '🍇', 'PFJ-008'],
  ['Anggur Muscat 500g', 7, '🍇', 'PFJ-009'],
  ['Anggur Red Globe Aus', 7, '🍇', 'PFJ-010'],
  ['Apel Dazzle', 7, '🍎', 'PFJ-011'],
  ['Apel Fuji Besar', 7, '🍎', 'PFJ-012'],
  ['Apel Fuji Mini', 7, '🍎', 'PFJ-013'],
  ['Apel Gala', 7, '🍎', 'PFJ-014'],
  ['Arla Organik 1L', 8, '🥛', 'PFJ-015'],
  ['Ayam Crispy KFC 700g', 1, '🍗', 'PFJ-016'],
  ['Ayam Crispy Sela Honje', 1, '🍗', 'PFJ-017'],
  ['Ayam Marinasi Belfoods', 1, '🍗', 'PFJ-018'],
  ['Ayam Nanas', 1, '🍗', 'PFJ-019'],
  ['Ayam Negri Bumbu Ungkep', 1, '🍗', 'PFJ-020'],
  ['Ayam Pawon Ayu', 1, '🍗', 'PFJ-021'],
  ['Ayam Pop Crispy', 1, '🍗', 'PFJ-022'],
  ['Bakso Cedea Ikan 500g', 3, '🍢', 'PFJ-023'],
  ['Bakso Panglima isi 10', 4, '🍡', 'PFJ-024'],
  ['Bakso Panglima isi 50', 4, '🍡', 'PFJ-025'],
  ['Bakso Seafood Mix Cedea', 3, '🍢', 'PFJ-026'],
  ['Bakso Selera Kita Isi 50', 4, '🍡', 'PFJ-027'],
  ['Bakso Shifudo 200g', 3, '🍢', 'PFJ-028'],

  // Page 2 (29 - 58)
  ['Bakso Sumber Selera Kebon Jeruk', 4, '🍡', 'PFJ-029'],
  ['Bakso Warisan AB 319', 4, '🍡', 'PFJ-030'],
  ['Bapao Karakter Isi 6 Coklat', 5, '🥟', 'PFJ-031'],
  ['Basreng Ori 200gr', 5, '🍟', 'PFJ-032'],
  ['Basreng Pedas 200gr', 5, '🍟', 'PFJ-033'],
  ['Bebek Pawon Ayu', 2, '🍗', 'PFJ-034'],
  ['Blueberry 125g', 7, '🫐', 'PFJ-035'],
  ['Cadbury 90g', 9, '🍫', 'PFJ-036'],
  ['Cadbury 160g', 9, '🍫', 'PFJ-037'],
  ['Cadbury Lickables 20g', 9, '🍫', 'PFJ-038'],
  ['Cadbury Mini Bite Isi 18', 9, '🍫', 'PFJ-039'],
  ['Cedea Fish Dumpling Cheese 500g', 3, '🍢', 'PFJ-040'],
  ['Cedea Fish Roll 250g', 3, '🍢', 'PFJ-041'],
  ['Cedea Fish Roll 500g', 3, '🍢', 'PFJ-042'],
  ['Ceres Spread Double Hazelnut 350g', 9, '🍫', 'PFJ-043'],
  ['Champ Nugget 250g', 1, '🍗', 'PFJ-044'],
  ['Champ Nugget 500g', 1, '🍗', 'PFJ-045'],
  ['Champ Nugget 1000g', 1, '🍗', 'PFJ-046'],
  ['Champ Sosis Ayam', 4, '🌭', 'PFJ-047'],
  ['Chicken Bite MCD 0,5kg', 1, '🍗', 'PFJ-048'],
  ['Chicken Bite MCD 1kg', 1, '🍗', 'PFJ-049'],
  ['Chicken Pok Pok 1kg', 1, '🍗', 'PFJ-050'],
  ['Chicken Strip 700gr', 1, '🍗', 'PFJ-051'],
  ['Chicken wing premium 1kg', 1, '🍗', 'PFJ-052'],
  ['Chikuwa Cedea 250g', 3, '🍢', 'PFJ-053'],
  ['Chunky Bar 30g', 9, '🍫', 'PFJ-054'],
  ['Chunky Bar 95g', 9, '🍫', 'PFJ-055'],
  ['Cilok Bumbu Kacang', 5, '🍢', 'PFJ-056'],
  ['Cimory Yoghurt Drink 200ml (Dus Isi 24)', 8, '🥛', 'PFJ-057'],
  ['Cireng Ayam Suwir Pedas Isi 10', 5, '🥟', 'PFJ-058'],

  // Page 3 (59 - 88)
  ['Cireng Brexcelle Isi 20', 5, '🥟', 'PFJ-059'],
  ['Cordon Blue isi 10', 1, '🍗', 'PFJ-060'],
  ['Crabstick 250g', 3, '🦀', 'PFJ-061'],
  ['Cumi Ring 0,5kg', 3, '🦑', 'PFJ-062'],
  ['Cumi Ring 1kg', 3, '🦑', 'PFJ-063'],
  ['Dada Ayam Fillet 500g', 2, '🍗', 'PFJ-064'],
  ['Dada Ayam Fillet 1kg', 2, '🍗', 'PFJ-065'],
  ['Daging Giling 250g', 2, '🥩', 'PFJ-066'],
  ['Daging Giling 500g', 2, '🥩', 'PFJ-067'],
  ['Daging Rawon 900g', 2, '🥩', 'PFJ-068'],
  ['Daging Rendang 500g', 2, '🥩', 'PFJ-069'],
  ['Daging Rendang 1kg', 2, '🥩', 'PFJ-070'],
  ['Delfi Treasure Golden Almond 3 pcs', 9, '🍫', 'PFJ-071'],
  ['Delima India', 7, '🍎', 'PFJ-072'],
  ['Dimsum Ayam Udang Isi 10', 5, '🥟', 'PFJ-073'],
  ['Dimsum Imperial Isi 30', 5, '🥟', 'PFJ-074'],
  ['Dimsum Imperial Tanpa Saus Isi 25', 5, '🥟', 'PFJ-075'],
  ['Dimsum Mix', 5, '🥟', 'PFJ-076'],
  ['Donat Kentang Edo', 6, '🍩', 'PFJ-077'],
  ['Donat Kentang Pelangi Isi 10', 6, '🍩', 'PFJ-078'],
  ['Donat Susu Muna Isi 10', 6, '🍩', 'PFJ-079'],
  ['Donut Susu', 6, '🍩', 'PFJ-080'],
  ['Dori Fillet 1kg', 3, '🐟', 'PFJ-081'],
  ['Dori Pop 0,5kg', 3, '🐟', 'PFJ-082'],
  ['Dori Pop 1kg', 3, '🐟', 'PFJ-083'],
  ['Dumpling Ayam', 5, '🥟', 'PFJ-084'],
  ['Durian Kupas Ucok Premium', 7, '🍈', 'PFJ-085'],
  ['Durian Nias Premium 500gr', 7, '🍈', 'PFJ-086'],
  ['Durian Nias reguler', 7, '🍈', 'PFJ-087'],
  ['Durian Shake 250ml', 7, '🥤', 'PFJ-088'],

  // Page 4 (89 - 118)
  ['Ebi Furay', 3, '🍤', 'PFJ-089'],
  ['Egg Roll Isi 3', 1, '🌯', 'PFJ-090'],
  ['Egg Roll Potong 15', 1, '🌯', 'PFJ-091'],
  ['Fiesta Cheesy Lover 500g', 1, '🍗', 'PFJ-092'],
  ['Fiesta Karage Chicken 500g', 1, '🍗', 'PFJ-093'],
  ['Fiesta Nugget 500g', 1, '🍗', 'PFJ-094'],
  ['Fiesta Nugget Crispy', 1, '🍗', 'PFJ-095'],
  ['Fiesta Spicy Wing 500g', 1, '🍗', 'PFJ-096'],
  ['Fomilk 1L', 8, '🥛', 'PFJ-097'],
  ['Greenfield 200ml', 8, '🥛', 'PFJ-098'],
  ['Greentea / Thaitea 250ml', 10, '🧋', 'PFJ-099'],
  ['Heviitro (Dus Isi 24)', 10, '🥤', 'PFJ-100'],
  ['Iga Gondrong Grade A 1kg', 2, '🥩', 'PFJ-101'],
  ['Iga Gondrong Grade B 1kg', 2, '🥩', 'PFJ-102'],
  ['Iga Gondrong Grade C 1kg', 2, '🥩', 'PFJ-103'],
  ['Iga Gondrong Premium 1kg', 2, '🥩', 'PFJ-104'],
  ['Ikan Nila Isi 3', 3, '🐟', 'PFJ-105'],
  ['Ikan Sishamo', 3, '🐟', 'PFJ-106'],
  ['Jambu Kristal Sunpride', 7, '🍏', 'PFJ-107'],
  ['Jamur Enoki 100g', 7, '🍄', 'PFJ-108'],
  ['Jeruk Dekopon', 7, '🍊', 'PFJ-109'],
  ['Jeruk murcot', 7, '🍊', 'PFJ-110'],
  ['Jeruk Peras', 7, '🍊', 'PFJ-111'],
  ['Jeruk Santang', 7, '🍊', 'PFJ-112'],
  ['Jeruk Sunkis', 7, '🍊', 'PFJ-113'],
  ['Jeruk Wogan (Wokam) 1kg', 7, '🍊', 'PFJ-114'],
  ['Kaki Naga Isi 10', 1, '🍢', 'PFJ-115'],
  ['Kaldu Blok 200g', 10, '🍲', 'PFJ-116'],
  ['Karage Lawson 1kg', 1, '🍗', 'PFJ-117'],
  ['Katsu Lawson 700gr', 1, '🍗', 'PFJ-118'],

  // Page 5 (119 - 148)
  ['Kebab Dezz Black Mozzarella', 5, '🌯', 'PFJ-119'],
  ['Kebab Dezz Moza', 5, '🌯', 'PFJ-120'],
  ['Kebab Dezz Ori', 5, '🌯', 'PFJ-121'],
  ['Kebab Turki', 5, '🌯', 'PFJ-122'],
  ['Kembung Presto Isi 2', 3, '🐟', 'PFJ-123'],
  ['Kentang Gogo Crinkle Cut 1kg', 6, '🍟', 'PFJ-124'],
  ['Kentang Gogo Shoestring 1kg', 6, '🍟', 'PFJ-125'],
  ['Kentang Gogo Shoestring 2kg', 6, '🍟', 'PFJ-126'],
  ['Kentang Mustofa box 750ml', 6, '🍟', 'PFJ-127'],
  ['Kentang Papatos', 6, '🍟', 'PFJ-128'],
  ['Kentang Richeese Batter 450g', 6, '🍟', 'PFJ-129'],
  ['Kentang Shoestring Curah 1kg', 6, '🍟', 'PFJ-130'],
  ['Kentang Shoestring Fiesta 500g', 6, '🍟', 'PFJ-131'],
  ['Kentang Simplot', 6, '🍟', 'PFJ-132'],
  ['Kentang Wedges 1kg', 6, '🍟', 'PFJ-133'],
  ['Keju Arla 240g', 8, '🧀', 'PFJ-134'],
  ['Keju Cheddar 160g', 8, '🧀', 'PFJ-135'],
  ['Keju Greenfield 200g', 8, '🧀', 'PFJ-136'],
  ['Keju Prochiz 160g', 8, '🧀', 'PFJ-137'],
  ['Keju Puck 140g', 8, '🧀', 'PFJ-138'],
  ['Keju Puck 240g', 8, '🧀', 'PFJ-139'],
  ['Keju Quickmelt 150g', 8, '🧀', 'PFJ-140'],
  ['Keripik Pisang Banana Coklat', 9, '🍌', 'PFJ-141'],
  ['Keripik Pisang Banana Manis', 9, '🍌', 'PFJ-142'],
  ['Keripik Pisang Banana Ori', 9, '🍌', 'PFJ-143'],
  ['Kiwi gold Zespri', 7, '🥝', 'PFJ-144'],
  ['Kiwi Merah Zespri', 7, '🥝', 'PFJ-145'],
  ['Leci Madu Hijau 1kg', 7, '🍒', 'PFJ-146'],
  ['Leci Madu Merah 1kg', 7, '🍒', 'PFJ-147'],
  ['Lele Fillet Bumbu', 3, '🐟', 'PFJ-148'],

  // Page 6 (149 - 178)
  ['Lele Tanpa Kepala Isi 8', 3, '🐟', 'PFJ-149'],
  ['Lemon Sereh 250ml', 10, '🍋', 'PFJ-150'],
  ['Lifebuoy Shampoo 680ml', 10, '🧴', 'PFJ-151'],
  ['Loacker wafer quadratini 125g', 9, '🧇', 'PFJ-152'],
  ['Loacker wafer quadratini 250g', 9, '🧇', 'PFJ-153'],
  ['Mangga Harum Manis', 7, '🥭', 'PFJ-154'],
  ['Melon Golden 1kg', 7, '🍈', 'PFJ-155'],
  ['Melon Rock 1kg', 7, '🍈', 'PFJ-156'],
  ['Minyak Wijen 195ml', 10, '🫒', 'PFJ-157'],
  ['Mipao Coklat Isi 30', 5, '🥟', 'PFJ-158'],
  ['Morin Kaya Spread 170g', 9, '🍯', 'PFJ-159'],
  ['Mung Bean Drink 200ml (Dus Isi 24)', 10, '🥤', 'PFJ-160'],
  ['Mydibel Crinkle Cut 1kg', 6, '🍟', 'PFJ-161'],
  ['Mydibel Hashbrown', 6, '🥔', 'PFJ-162'],
  ['Mydibel Shoestring 0,5kg', 6, '🍟', 'PFJ-163'],
  ['Mydibel Shoestring 1kg', 6, '🍟', 'PFJ-164'],
  ['Nestle Carnation 405g', 8, '🥫', 'PFJ-165'],
  ['Nugget Kanzler Crispy 450g', 1, '🍗', 'PFJ-166'],
  ['Nugget Kanzler Crispy Pedas 450g', 1, '🍗', 'PFJ-167'],
  ['Nugget Kanzler Crispy Stick 450g', 1, '🍗', 'PFJ-168'],
  ['Nugget So Eco 1kg', 1, '🍗', 'PFJ-169'],
  ['Nutella 200g', 9, '🍫', 'PFJ-170'],
  ['Nutella 350g', 9, '🍫', 'PFJ-171'],
  ['Otak-Otak Bandeng', 3, '🐟', 'PFJ-172'],
  ['Otak-Otak Sanjaya 1kg', 3, '🍢', 'PFJ-173'],
  ['Otak-Otak Singapore 0,5kg', 3, '🍢', 'PFJ-174'],
  ['Ovomaltine 230g', 9, '🍫', 'PFJ-175'],
  ['Paha Fillet Ayam 500g', 2, '🍗', 'PFJ-176'],
  ['Paha Fillet Ayam 1kg', 2, '🍗', 'PFJ-177'],
  ['Paha Pentung 1kg', 2, '🍗', 'PFJ-178'],

  // Page 7 (179 - 208)
  ['Paket Roti Burger Mini', 5, '🍔', 'PFJ-179'],
  ['Pangsit Kuah Asyifa Isi 10', 5, '🥟', 'PFJ-180'],
  ['Pangsit Tulang Rangu', 5, '🥟', 'PFJ-181'],
  ['Pempek Campur CKA', 5, '🥟', 'PFJ-182'],
  ['Pempek Dos', 5, '🥟', 'PFJ-183'],
  ['Pempek Lenjer CKA', 5, '🥟', 'PFJ-184'],
  ['Pir Century', 7, '🍐', 'PFJ-185'],
  ['Pir Singo 1kg', 7, '🍐', 'PFJ-186'],
  ['Popcorn 500gr', 9, '🍿', 'PFJ-187'],
  ['Pringles 42g', 9, '🥔', 'PFJ-188'],
  ['Pringles 42g (Dus Isi 12)', 9, '📦', 'PFJ-189'],
  ['Prochiz Mozzarella 160g', 8, '🧀', 'PFJ-190'],
  ['Prochiz Spready 160g', 8, '🧀', 'PFJ-191'],
  ['Risbun', 5, '🥐', 'PFJ-192'],
  ['Risol Kampung + Sambel Kacang Isi 10', 5, '🥟', 'PFJ-193'],
  ['Risol Rogut Homemade Premium Isi 10', 5, '🥟', 'PFJ-194'],
  ['Risol Smoked Beef Mayo Isi 5', 5, '🥟', 'PFJ-195'],
  ['Risollaku Risol Kampung', 5, '🥟', 'PFJ-196'],
  ['Risollaku Smoked Beef Mayo Isi 10', 5, '🥟', 'PFJ-197'],
  ['Rolade Ayam', 1, '🍖', 'PFJ-198'],
  ['Rolade Sapi', 2, '🍖', 'PFJ-199'],
  ['Rootz Stick Singkong 900g', 6, '🍟', 'PFJ-200'],
  ['Roti Goreng Coklat/Mozzarella Isi 10', 5, '🍞', 'PFJ-201'],
  ['Roti Maryam Coklat/Keju', 5, '🥞', 'PFJ-202'],
  ['Roti Maryam Ori', 5, '🥞', 'PFJ-203'],
  ['Saikoro 500g', 2, '🥩', 'PFJ-204'],
  ['Salmon Portion 110g', 3, '🐟', 'PFJ-205'],
  ['Sayur Mix 1kg', 7, '🥦', 'PFJ-206'],
  ['Seoul Banana 180ml', 10, '🍌', 'PFJ-207'],
  ['Shrimproll Isi 10', 3, '🍤', 'PFJ-208'],

  // Page 8 (209 - 238)
  ['Silverqueen 58g', 9, '🍫', 'PFJ-209'],
  ['Singkong Bang Toyib', 6, '🍠', 'PFJ-210'],
  ['Singkong Keju', 6, '🍠', 'PFJ-211'],
  ['Skippy 170g', 9, '🥜', 'PFJ-212'],
  ['Skippy 340g', 9, '🥜', 'PFJ-213'],
  ['Slice Lemak 500g', 2, '🥩', 'PFJ-214'],
  ['Slice Marinasi 450g', 2, '🥩', 'PFJ-215'],
  ['Slice Non-Lemak 500g', 2, '🥩', 'PFJ-216'],
  ['Slice Teriyaki 500g', 2, '🥩', 'PFJ-217'],
  ['Slice Yoshinoya 500g', 2, '🥩', 'PFJ-218'],
  ['So Eco Sosis Ayam 750g', 4, '🌭', 'PFJ-219'],
  ['So Nice Sosis Ayam Kombinasi 375g', 4, '🌭', 'PFJ-220'],
  ['Sosis Bakar Vigo Isi 12', 4, '🌭', 'PFJ-221'],
  ['Sosis Kimbo Bratwurst', 4, '🌭', 'PFJ-222'],
  ['Sosis Kimbo Cocktail', 4, '🌭', 'PFJ-223'],
  ['Spicy Chicken Isi 10', 1, '🍗', 'PFJ-224'],
  ['Spicy Wing Ayam Segar Belfoods', 1, '🍗', 'PFJ-225'],
  ['Spicy Wing Pizza Hut 500g', 1, '🍗', 'PFJ-226'],
  ['Spicy Wing Pizza Hut 1kg', 1, '🍗', 'PFJ-227'],
  ['Steamboat Cedea 300g', 3, '🍲', 'PFJ-228'],
  ['Susu Almond Breeze 180ml', 8, '🥛', 'PFJ-229'],
  ['Susu Almond Breeze 946ml', 8, '🥛', 'PFJ-230'],
  ['Susu Kambing Etawa', 8, '🥛', 'PFJ-231'],
  ['Susu Marigold 385g', 8, '🥛', 'PFJ-232'],
  ['Susu Ultra Milk 250ml', 8, '🥛', 'PFJ-233'],
  ['Tahu Abah Momon', 5, '🧈', 'PFJ-234'],
  ['Tahu Bakso Homemade Premium Isi 10', 4, '🍢', 'PFJ-235'],
  ['Tahu Bakso MDS Ori Isi 10', 4, '🍢', 'PFJ-236'],
  ['Tahu Bakso MDS Pedas Isi 10', 4, '🍢', 'PFJ-237'],
  ['Tahu Bakso Tuna Isi 10', 4, '🍢', 'PFJ-238'],

  // Page 9 (239 - 252)
  ['Tahu Susu', 5, '🧈', 'PFJ-239'],
  ['Tahu Tuna Pacitan', 3, '🐟', 'PFJ-240'],
  ['Tetelan 500g', 2, '🥩', 'PFJ-241'],
  ['Tropicana Slim 190ml', 10, '🧃', 'PFJ-242'],
  ['Tropicana Slim Honey Sweetener 50 Sachet', 10, '🍯', 'PFJ-243'],
  ['Tulang Iga Konro 500g', 2, '🥩', 'PFJ-244'],
  ['Tulang Leher Full Daging', 2, '🥩', 'PFJ-245'],
  ['Udang kupas 500g', 3, '🦐', 'PFJ-246'],
  ['Udang tepung premium 500gr', 3, '🍤', 'PFJ-247'],
  ['Uli Ketan Isi 8', 5, '🍙', 'PFJ-248'],
  ['Up Kopi 250ml', 10, '☕', 'PFJ-249'],
  ['Vitalia Isi 20', 5, '🥟', 'PFJ-250'],
  ['Yoghurt Stick Isi 30', 8, '🍦', 'PFJ-251'],
  ['Yoyic Susu Bantal 16x90ml', 8, '🥛', 'PFJ-252'],
];

async function run() {
  console.log(`🚀 Menyiapkan database PFFJ (${PRODUCTS.length} produk)...`);

  console.log('🧹 Menghapus produk dan kategori lama PFFJ...');
  await executeStatements([
    { sql: 'DELETE FROM products' },
    { sql: 'DELETE FROM categories' },
  ]);

  console.log(`📁 Memasukkan ${CATEGORIES.length} kategori baru...`);
  const catStmts = CATEGORIES.map(c => ({
    sql: 'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
    args: [c.id, c.name, c.color]
  }));
  await executeStatements(catStmts);

  console.log(`📦 Memasukkan ${PRODUCTS.length} produk baru (batching 40/req)...`);
  const BATCH_SIZE = 40;
  for (let i = 0; i < PRODUCTS.length; i += BATCH_SIZE) {
    const chunk = PRODUCTS.slice(i, i + BATCH_SIZE);
    const prodStmts = chunk.map(([name, catId, emoji, barcode]) => ({
      sql: `INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, is_active)
            VALUES (?, 0, 0, 0, 0, ?, ?, ?, 1)`,
      args: [name, catId, emoji, barcode]
    }));
    await executeStatements(prodStmts);
    console.log(`   ✓ Produk ${i + 1} s/d ${Math.min(i + BATCH_SIZE, PRODUCTS.length)} selesai`);
  }

  console.log('🎉 SELESAI! Semua produk PFFJ berhasil dimasukkan!');
}

run().catch(console.error);

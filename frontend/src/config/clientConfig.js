// Konfigurasi dinamis untuk klien (PLM vs PFFJ)
// Mengutamakan Environment Variable VITE_CLIENT ('pffj' atau 'plm'),
// dengan fallback pendeteksian nama domain URL jika mengandung 'pffj' atau 'plm'.

function getClientType() {
  // 1. Environment Variable Vite
  const envClient = import.meta.env.VITE_CLIENT?.toLowerCase().trim();
  if (envClient === 'pffj') return 'pffj';
  if (envClient === 'plm') return 'plm';

  // 2. LocalStorage override (berguna untuk testing langsung di browser tanpa build ulang)
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('app_client_override')?.toLowerCase().trim();
      if (local === 'pffj') return 'pffj';
      if (local === 'plm') return 'plm';

      // 3. Fallback deteksi subdomain / hostname URL
      const host = window.location.hostname.toLowerCase();
      if (host.includes('pffj')) return 'pffj';
      if (host.includes('plm')) return 'plm';
    } catch {
      // ignore
    }
  }

  // Default ke 'plm'
  return 'plm';
}

export const clientType = getClientType();
export const isPFFJ = clientType === 'pffj';

export const PRICE_LABELS = isPFFJ
  ? {
      // === PFFJ CLIENT (Umum & Reseller) ===
      regularName: 'Harga Biasa',
      regularShort: 'Umum',
      regularBadge: '👤 Umum',
      regularCustomer: '👤 Pelanggan Umum',
      regularFormLabel: 'Harga Biasa (Retail) *',
      regularFormHint: 'Untuk pelanggan umum',
      regularProfitLabel: 'Laba Pelanggan Biasa:',
      regularToastRequired: 'Nama dan harga jual biasa wajib diisi',

      specialName: 'Harga Reseller',
      specialShort: 'Reseller',
      specialBadge: '🏷️ Reseller',
      specialCustomer: '🏷️ Reseller (Grosir)',
      specialModeActive: 'Mode Reseller Aktif',
      specialFormLabel: 'Harga Reseller (Grosir)',
      specialFormHint: 'Kosongkan / 0 jika sama',
      specialProfitLabel: 'Laba Reseller:',

      pricingSectionTitle: 'Pengaturan Harga Jual & Reseller',
      priceCatalogRegular: (price) => `Biasa: ${price}`,
      priceCatalogSpecial: (price) => `Reseller: ${price}`,

      codeLabel: 'Barcode (Opsional)',
      codePlaceholder: 'Nomor barcode...',
      codeShort: 'Barcode',
      searchPlaceholder: 'Cari nama produk atau barcode...',
    }
  : {
      // === PLM CLIENT (Harga Toko & Harga Supplier) ===
      regularName: 'Harga Toko',
      regularShort: 'Toko',
      regularBadge: '👤 Toko',
      regularCustomer: '👤 Harga Toko',
      regularFormLabel: 'Harga Toko *',
      regularFormHint: 'Harga standar / toko',
      regularProfitLabel: 'Laba Harga Toko:',
      regularToastRequired: 'Nama dan harga toko wajib diisi',

      specialName: 'Harga Supplier',
      specialShort: 'Supplier',
      specialBadge: '🏷️ Supplier',
      specialCustomer: '🏷️ Harga Supplier',
      specialModeActive: 'Mode Supplier Aktif',
      specialFormLabel: 'Harga Supplier',
      specialFormHint: 'Kosongkan / 0 jika sama',
      specialProfitLabel: 'Laba Supplier:',

      pricingSectionTitle: 'Pengaturan Harga Toko & Supplier',
      priceCatalogRegular: (price) => `Toko: ${price}`,
      priceCatalogSpecial: (price) => `Supplier: ${price}`,

      codeLabel: 'Article / Kode Barang (Opsional)',
      codePlaceholder: 'Contoh: ART-001, KD-102...',
      codeShort: 'Article',
      searchPlaceholder: 'Cari nama produk, article, atau kode...',
    };

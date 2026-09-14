import React, { useState, useEffect } from 'react';
import { productsApi } from '../api';
import { formatRupiah } from '../utils/format';
import Modal from '../components/ui/Modal';
import {
  Plus, Search, Edit2, Package, AlertTriangle,
  Check, CheckCircle2, PowerOff, Tag, PackagePlus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const EMOJIS = ['🍳','🍜','🍗','🍕','🍔','🌮','🥗','🍱','🥘','🍰','🧁','🍩','🍦','🥤','🧋','☕','🍊','🍓','🥪','🌭','🍟','🧃','🥛','🍺','🧊','📦','🛒','🎁','💊','🧴','🧼','🪥','📚','🎮','🎧','📱','💻','⌚','🔑','🧲','🔋','💡','🪴','🧺','🛋️','🪑','🧹','🪣','🔧'];

const defaultForm = {
  name: '',
  price: '',
  reseller_price: '',
  cost_price: '',
  stock: '',
  category_id: '',
  emoji: '📦',
  barcode: '',
  description: '',
  is_active: true,
};

function ProductFormModal({ isOpen, onClose, editProduct, categories, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        price: String(editProduct.price || ''),
        reseller_price: String(editProduct.reseller_price || ''),
        cost_price: String(editProduct.cost_price || 0),
        stock: String(editProduct.stock),
        category_id: String(editProduct.category_id || ''),
        emoji: editProduct.emoji || '📦',
        barcode: editProduct.barcode || '',
        description: editProduct.description || '',
        is_active: editProduct.is_active === 1 || editProduct.is_active === true,
      });
    } else {
      setForm(defaultForm);
    }
    setShowEmojiPicker(false);
  }, [editProduct, isOpen]);

  const priceNum = parseFloat(form.price) || 0;
  const resellerNum = parseFloat(form.reseller_price) || 0;
  const costNum = parseFloat(form.cost_price) || 0;

  const normalProfit = priceNum - costNum;
  const normalMargin = priceNum > 0 ? Math.round((normalProfit / priceNum) * 100) : 0;

  const resellerProfit = resellerNum > 0 ? resellerNum - costNum : 0;
  const resellerMargin = resellerNum > 0 ? Math.round((resellerProfit / resellerNum) * 100) : 0;

  function handleStockChange(val) {
    const nextStock = val;
    setForm((f) => {
      const autoActive = !f.is_active && parseInt(nextStock) > 0 ? true : f.is_active;
      return { ...f, stock: nextStock, is_active: autoActive };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Nama dan harga jual biasa wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        reseller_price: parseFloat(form.reseller_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        stock: parseInt(form.stock) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        emoji: form.emoji,
        barcode: form.barcode,
        description: form.description,
        is_active: form.is_active ? 1 : 0,
      };

      if (editProduct) {
        await productsApi.update(editProduct.id, payload);
        toast.success(
          payload.is_active
            ? 'Produk berhasil diperbarui & berstatus AKTIF'
            : 'Produk berhasil diperbarui (Nonaktif)'
        );
      } else {
        await productsApi.create(payload);
        toast.success('Produk berhasil ditambahkan');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editProduct ? '✏️ Edit Produk & Harga' : '➕ Tambah Produk'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : editProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Emoji Picker */}
        <div className="form-group">
          <label className="form-label">Ikon Produk</label>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: 60, height: 60, fontSize: 28, borderRadius: 12 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            {form.emoji}
          </button>
          {showEmojiPicker && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              <div className="emoji-grid">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`emoji-option${form.emoji === em ? ' selected' : ''}`}
                    onClick={() => { setForm((f) => ({ ...f, emoji: em })); setShowEmojiPicker(false); }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Nama Produk *</label>
          <input className="form-input" placeholder="Nama produk" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>

        {/* Pricing Grid: Harga Biasa vs Reseller vs Modal */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={15} /> Pengaturan Harga Jual & Reseller
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Harga Biasa (Retail) *</label>
              <input type="number" className="form-input" placeholder="0" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required min={0} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Untuk pelanggan umum</span>
            </div>
            <div className="form-group">
              <label className="form-label">Harga Reseller (Grosir)</label>
              <input type="number" className="form-input" placeholder="0" value={form.reseller_price}
                onChange={(e) => setForm((f) => ({ ...f, reseller_price: e.target.value }))} min={0} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kosongkan / 0 jika sama</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label">Harga Modal / HPP (Rp)</label>
            <input type="number" className="form-input" placeholder="0" value={form.cost_price}
              onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))} min={0} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Modal pokok barang untuk hitung laba</span>
          </div>

          {/* Profit Comparison Preview */}
          {priceNum > 0 && (
            <div style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Laba Pelanggan Biasa:</span>
                <span style={{ fontWeight: 700, color: normalProfit >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                  +{formatRupiah(normalProfit)} <span style={{ color: 'var(--text-muted)' }}>({normalMargin}%)</span>
                </span>
              </div>
              {resellerNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Laba Reseller:</span>
                  <span style={{ fontWeight: 700, color: resellerProfit >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                    +{formatRupiah(resellerProfit)} <span style={{ color: 'var(--text-muted)' }}>({resellerMargin}%)</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Stok</label>
            <input type="number" className="form-input" placeholder="0" value={form.stock}
              onChange={(e) => handleStockChange(e.target.value)} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-select" value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">-- Tanpa Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Produk Switch */}
        <div className="form-group">
          <label className="form-label">Status Produk</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className={`btn ${form.is_active ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px' }}
              onClick={() => setForm((f) => ({ ...f, is_active: true }))}
            >
              <CheckCircle2 size={16} /> Aktif (Bisa Dijual)
            </button>
            <button
              type="button"
              className={`btn ${!form.is_active ? 'btn-danger' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px' }}
              onClick={() => setForm((f) => ({ ...f, is_active: false }))}
            >
              <PowerOff size={16} /> Nonaktif (Sembunyikan)
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {form.is_active
              ? '✅ Produk tampil di halaman Kasir (POS) dan dapat ditransaksikan.'
              : '⚠️ Produk disembunyikan dari halaman Kasir (POS).'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Barcode (Opsional)</label>
          <input className="form-input" placeholder="Nomor barcode..." value={form.barcode}
            onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Deskripsi (Opsional)</label>
          <textarea className="form-textarea" placeholder="Deskripsi produk..." value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
        </div>
      </form>
    </Modal>
  );
}

// ====== RESTOCK MODAL (untuk kasir) ======
function RestockModal({ isOpen, onClose, product, onSaved }) {
  const [addStock, setAddStock] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setAddStock('');
  }, [isOpen, product]);

  async function handleSubmit(e) {
    e.preventDefault();
    const jumlah = parseInt(addStock);
    if (!jumlah || jumlah <= 0) {
      toast.error('Masukkan jumlah stok masuk yang valid');
      return;
    }
    setLoading(true);
    try {
      const newStock = (product.stock || 0) + jumlah;
      await productsApi.update(product.id, {
        name: product.name,
        price: product.price,
        reseller_price: product.reseller_price || 0,
        cost_price: product.cost_price || 0,
        stock: newStock,
        category_id: product.category_id || null,
        emoji: product.emoji || '📦',
        barcode: product.barcode || '',
        description: product.description || '',
        is_active: newStock > 0 ? 1 : (product.is_active ? 1 : 0),
      });
      toast.success(`✅ Stok ${product.name} berhasil ditambah +${jumlah} (Total: ${newStock})`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!product) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📦 Input Stok Masuk"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><PackagePlus size={15} /> Tambah Stok</>}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Info Produk */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>{product.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{product.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Stok saat ini: <strong style={{ color: 'var(--white)' }}>{product.stock}</strong> unit</div>
          </div>
        </div>

        {/* Input stok masuk */}
        <div className="form-group">
          <label className="form-label">Jumlah Stok Masuk *</label>
          <input
            type="number"
            className="form-input"
            placeholder="Masukkan jumlah barang yang datang..."
            value={addStock}
            onChange={(e) => setAddStock(e.target.value)}
            min={1}
            autoFocus
            required
          />
          {addStock && parseInt(addStock) > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Stok setelah update: <strong style={{ color: 'var(--white)' }}>{(product.stock || 0) + parseInt(addStock)}</strong> unit
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productsApi.getAll({ active: 'all' }),
        productsApi.getCategories(),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Gagal memuat produk: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(product) {
    try {
      const res = await productsApi.toggleStatus(product.id);
      const isNowActive = res.data?.is_active === 1 || res.data?.is_active === true || res.is_active === 1;
      toast.success(isNowActive ? `✅ Produk ${product.name} diaktifkan kembali` : `Produk ${product.name} dinonaktifkan`);
      loadData();
    } catch (err) {
      toast.error('Gagal mengubah status: ' + err.message);
    }
  }

  async function handleDelete(product) {
    try {
      await productsApi.delete(product.id);
      toast.success('Produk dinonaktifkan');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search));
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.is_active === 1 || p.is_active === true
        : p.is_active === 0 || p.is_active === false;
    return matchCat && matchSearch && matchStatus;
  });

  const activeCount = products.filter((p) => p.is_active).length;
  const inactiveCount = products.filter((p) => !p.is_active).length;
  const lowStockCount = products.filter((p) => p.is_active && p.stock <= 10).length;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Manajemen Produk' : 'Produk & Stok Masuk'}</h1>
          <p className="page-subtitle">
            {activeCount} produk aktif • {inactiveCount} nonaktif • {lowStockCount} stok menipis
            {!isAdmin && <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>— Mode: Input Stok Saja</span>}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
            <Plus size={16} /> Tambah Produk
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search className="search-icon" />
          <input className="form-input" placeholder="Cari nama produk atau barcode..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="active">Hanya Aktif</option>
          <option value="inactive">Hanya Nonaktif</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
          <option value="all">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p className="empty-title">Tidak ada produk</p>
              <p className="empty-text">
                {statusFilter === 'inactive' ? 'Tidak ada produk nonaktif' : 'Tambah produk baru untuk memulai'}
              </p>
              {statusFilter !== 'all' ? (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setStatusFilter('all')}>
                  Lihat Semua Produk
                </button>
              ) : isAdmin ? (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}
                  onClick={() => { setEditProduct(null); setShowModal(true); }}>
                  <Plus size={14} /> Tambah Produk
                </button>
              ) : null}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Harga Biasa</th>
                  <th style={{ textAlign: 'right' }}>Harga Reseller</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Harga Modal</th>}
                  {isAdmin && <th style={{ textAlign: 'right' }}>Estimasi Laba</th>}
                  <th style={{ textAlign: 'center' }}>Stok</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isLow = p.stock <= 10 && p.stock > 0;
                  const isOut = p.stock <= 0;
                  const unitProfit = (p.price || 0) - (p.cost_price || 0);
                  const margin = p.price > 0 ? Math.round((unitProfit / p.price) * 100) : 0;
                  const isActive = p.is_active === 1 || p.is_active === true;
                  const hasResellerPrice = p.reseller_price > 0;

                  return (
                    <tr key={p.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                            {p.barcode && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.category_name ? (
                          <span className="badge badge-purple">{p.category_name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatRupiah(p.price)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13 }}>
                        {hasResellerPrice ? (
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--white)' }}>
                              {formatRupiah(p.reseller_price)}
                            </span>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Hemat {formatRupiah(p.price - p.reseller_price)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                          {p.cost_price ? formatRupiah(p.cost_price) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      )}
                      {isAdmin && (
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          {p.cost_price > 0 ? (
                            <div>
                              <span style={{ fontWeight: 600, color: unitProfit >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                                +{formatRupiah(unitProfit)}
                              </span>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>({margin}%)</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', width: 'fit-content', margin: 'auto' }}>
                          {isLow && <AlertTriangle size={10} />}
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                            style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease' }}
                            title={isActive ? 'Klik untuk nonaktifkan produk' : 'Klik untuk mengaktifkan kembali'}
                          >
                            {isActive ? '● Aktif' : '○ Nonaktif'}
                          </button>
                        ) : (
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                            {isActive ? '● Aktif' : '○ Nonaktif'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {isAdmin ? (
                            <>
                              <button className="btn btn-secondary btn-sm btn-icon"
                                title="Edit & Restok Produk" onClick={() => { setEditProduct(p); setShowModal(true); }}>
                                <Edit2 size={14} />
                              </button>
                              {isActive ? (
                                <button className="btn btn-secondary btn-sm btn-icon"
                                  title="Nonaktifkan Produk" onClick={() => setDeleteConfirm(p)}>
                                  <PowerOff size={14} style={{ color: 'var(--danger)' }} />
                                </button>
                              ) : (
                                <button className="btn btn-primary btn-sm btn-icon"
                                  title="Aktifkan Kembali Produk Ini" onClick={() => handleToggleStatus(p)}>
                                  <Check size={14} />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ gap: 5, padding: '5px 10px', fontSize: 12 }}
                              title="Input Stok Masuk"
                              onClick={() => setRestockProduct(p)}
                            >
                              <PackagePlus size={13} /> Restock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product Form Modal (admin only) */}
      {isAdmin && (
        <ProductFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editProduct={editProduct}
          categories={categories}
          onSaved={loadData}
        />
      )}

      {/* Restock Modal (kasir) */}
      <RestockModal
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        product={restockProduct}
        onSaved={loadData}
      />

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Nonaktifkan Produk"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
              <PowerOff size={14} /> Ya, Nonaktifkan
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin menonaktifkan produk <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.name}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
          Produk tidak akan dihapus permanen. Produk ini hanya disembunyikan dari halaman Kasir dan dapat diaktifkan kembali kapan saja dengan 1 klik.
        </p>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { transactionsApi } from '../api';
import { formatRupiah, formatDate } from '../utils/format';
import Modal from '../components/ui/Modal';
import { Search, Eye, Trash2, Printer, Filter, Calendar, Truck, TrendingUp, Package } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

function TransactionDetail({ transaction, onClose, isAdmin }) {
  const handlePrint = () => window.print();
  const isDelivery = (transaction.shipping_cost || 0) > 0;

  const totalCost = transaction.total_cost || 0;
  const profit = transaction.profit !== undefined ? transaction.profit : (transaction.grand_total - (transaction.shipping_cost || 0) - totalCost);
  const revenueWithoutShipping = transaction.grand_total - (transaction.shipping_cost || 0);
  const marginPct = revenueWithoutShipping > 0 ? Math.round((profit / revenueWithoutShipping) * 100) : 0;

  return (
    <Modal isOpen={true} onClose={onClose} title="Detail Transaksi" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Invoice Info */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              ['No. Invoice', transaction.invoice_number],
              ['Tipe Pelanggan', transaction.customer_type === 'reseller' ? '🏷️ Reseller (Grosir)' : '👤 Pelanggan Biasa'],
              ['Tanggal', formatDate(transaction.created_at)],
              ['Kasir', transaction.cashier_name],
              ['Metode Bayar', transaction.payment_method === 'cash' ? '💵 Tunai' : '💳 Transfer'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping info if applicable */}
        {isDelivery && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Truck size={16} style={{ color: 'var(--text-primary)' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Informasi Ekspedisi & Pengiriman</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kurir / Ekspedisi</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{transaction.shipping_name || 'Ekspedisi'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Penerima</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{transaction.recipient_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ongkir Dibayar Customer</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{formatRupiah(transaction.shipping_cost)}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Alamat Tujuan</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{transaction.recipient_address || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Item Pembelian
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {transaction.items?.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.quantity}x {formatRupiah(item.product_price)}
                    {item.product_cost > 0 && (
                      <span> • Modal: {formatRupiah(item.product_cost)}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatRupiah(item.subtotal)}
                  </div>
                  {item.profit !== undefined && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Laba: +{formatRupiah(item.profit)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Profit Breakdown */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          {[
            ['Subtotal Produk', formatRupiah(transaction.total)],
            transaction.discount > 0 ? ['Diskon', `- ${formatRupiah(transaction.discount)}`] : null,
            transaction.tax > 0 ? ['Pajak', formatRupiah(transaction.tax)] : null,
            isDelivery ? [`Biaya Ongkir (${transaction.shipping_name || 'Ekspedisi'})`, formatRupiah(transaction.shipping_cost)] : null,
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Total Pembayaran</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatRupiah(transaction.grand_total)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Jumlah Bayar</span>
            <span>{formatRupiah(transaction.amount_paid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Kembalian</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatRupiah(transaction.change_amount)}
            </span>
          </div>

          {/* Profit Summary Box — admin only */}
          {isAdmin && (
            <div style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={15} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Laba Bersih Transaksi</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HPP Modal: {formatRupiah(totalCost)} (Margin: {marginPct}%)</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                +{formatRupiah(profit)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadData();
  }, [filterDate]);

  async function loadData(page = 1) {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filterDate) params.date = filterDate;
      const res = await transactionsApi.getAll(params);
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Gagal memuat transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    try {
      const res = await transactionsApi.getById(id);
      setSelectedTransaction(res.data);
    } catch (err) {
      toast.error('Gagal memuat detail: ' + err.message);
    }
  }

  async function handleDelete(t) {
    try {
      await transactionsApi.delete(t.id);
      toast.success('Transaksi dihapus');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const filtered = transactions.filter((t) =>
    !search || t.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p className="page-subtitle">{pagination.total} total transaksi tersimpan</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search className="search-icon" />
          <input className="form-input" placeholder="Cari nomor invoice..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 12px' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            className="form-input"
            style={{ border: 'none', background: 'transparent', padding: '10px 0', width: 140 }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        {filterDate && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilterDate('')}>
            Hapus Filter
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🧾</span>
              <p className="empty-title">Belum ada transaksi</p>
              <p className="empty-text">Mulai berjualan dari halaman Kasir</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Tanggal & Waktu</th>
                  <th>Kasir</th>
                  <th>Pengiriman</th>
                  <th>Metode</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Laba Bersih</th>}
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                          {t.invoice_number}
                        </span>
                        {t.customer_type === 'reseller' && (
                          <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 5px' }}>
                            Reseller
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(t.created_at)}</td>
                    <td>{t.cashier_name}</td>
                    <td>
                      {t.shipping_cost > 0 ? (
                        <div>
                          <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={12} /> {t.shipping_name || 'Ekspedisi'}
                          </span>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            +{formatRupiah(t.shipping_cost)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ambil di Toko</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${t.payment_method === 'cash' ? 'success' : 'info'}`}>
                        {t.payment_method === 'cash' ? '💵 Tunai' : '💳 Transfer'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right', fontWeight: 700, color: (t.profit || 0) >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                        +{formatRupiah(t.profit || 0)}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatRupiah(t.grand_total)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-secondary btn-sm btn-icon"
                          title="Lihat Detail" onClick={() => loadDetail(t.id)}>
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm btn-icon"
                            title="Hapus" onClick={() => setDeleteConfirm(t)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: 36, padding: 0 }}
                onClick={() => loadData(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetail transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} isAdmin={isAdmin} />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Transaksi"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
              <Trash2 size={14} /> Ya, Hapus
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Apakah Anda yakin ingin menghapus transaksi{' '}
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            {deleteConfirm?.invoice_number}
          </strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { formatRupiah, formatDateShort, formatDate } from '../utils/format';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  BarChart2, Clock, ArrowUpRight, DollarSign, Truck, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

function SimpleBarChart({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return (
    <div className="empty-state">
      <span className="empty-icon">📊</span>
      <p className="empty-title">Belum ada data</p>
    </div>
  );

  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue) || 0), 1);

  return (
    <div style={{ padding: '16px 0' }}>
      <div className="simple-bar-chart">
        {data.map((item, idx) => {
          const rev = Number(item.revenue) || 0;
          const heightPct = (rev / maxRevenue) * 100;
          return (
            <div key={idx} className="bar-item" title={`${formatDateShort(item.date)}: Omset ${formatRupiah(rev)} | Laba ${formatRupiah(item.profit || 0)}`}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div
                  className="bar-fill"
                  style={{ height: `${Math.max(heightPct, 4)}%`, width: '100%' }}
                />
              </div>
              <span className="bar-label">{formatDateShort(item.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await dashboardApi.getSummary();
      setData(res?.data || res);
    } catch (err) {
      toast.error('Gagal memuat dashboard: ' + err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: 14 }}>
        <div className="spinner" style={{ width: 34, height: 34 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Memuat data dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          ⚠️
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Gagal Memuat Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420 }}>Tidak dapat mengambil ringkasan transaksi. Silakan periksa koneksi atau klik tombol muat ulang.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={loadData} style={{ padding: '8px 20px', gap: 6 }}>
          <ArrowUpRight size={14} /> Coba Muat Ulang
        </button>
      </div>
    );
  }

  const today = data?.today || {};
  const month = data?.month || data?.this_month || {};
  const products = data?.products || {};
  const rawTopProducts = data?.topProducts || data?.top_products || [];
  const topProducts = Array.isArray(rawTopProducts) ? rawTopProducts.map((p) => ({
    product_name: p.product_name || p.name || 'Produk',
    total_sold: p.total_sold || p.sold || 0,
    total_revenue: p.total_revenue || p.revenue || 0,
    total_profit: p.total_profit || p.profit || 0,
  })) : [];
  const raw7Days = data?.last7Days || data?.last_7_days || [];
  const last7Days = Array.isArray(raw7Days) ? raw7Days.map((d) => ({
    date: d.date || d.label,
    revenue: d.revenue || d.grand_total || 0,
    profit: d.profit || 0,
    transactions: d.transactions || d.count || 0,
  })) : [];
  const rawRecent = data?.recentTransactions || data?.recent_transactions || [];
  const recentTransactions = Array.isArray(rawRecent) ? rawRecent : [];

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const todayRevenue = today?.total_revenue ?? today?.revenue ?? 0;
  const todayProfit = today?.total_profit ?? today?.profit ?? 0;
  const todayCount = today?.transaction_count ?? today?.count ?? 0;
  const todayMargin = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;

  const monthRevenue = month?.total_revenue ?? month?.revenue ?? 0;
  const monthProfit = month?.total_profit ?? month?.profit ?? 0;
  const monthCount = month?.transaction_count ?? month?.count ?? 0;
  const monthMargin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0;

  const totalProducts = products?.total_products ?? products?.total ?? 0;
  const lowStockCount = products?.low_stock_count ?? products?.low_stock ?? 0;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Kasir</h1>
          <p className="page-subtitle">Ringkasan penjualan, estimasi laba & performa toko</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <ArrowUpRight size={14} /> Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div className="stat-label">Omset Hari Ini</div>
          <div className="stat-value">{formatRupiah(todayRevenue)}</div>
          <div className="stat-sub">{todayCount} transaksi</div>
        </div>

        {isAdmin && (
          <div className="stat-card purple">
            <div className="stat-icon purple"><Wallet size={22} /></div>
            <div className="stat-label">Laba Bersih Hari Ini</div>
            <div className="stat-value">{formatRupiah(todayProfit)}</div>
            <div className="stat-sub">Margin: {todayMargin}% dari omset</div>
          </div>
        )}

        <div className="stat-card green">
          <div className="stat-icon green"><ShoppingCart size={22} /></div>
          <div className="stat-label">Omset Bulan Ini</div>
          <div className="stat-value">{formatRupiah(monthRevenue)}</div>
          <div className="stat-sub">{monthCount} transaksi</div>
        </div>

        {isAdmin && (
          <div className="stat-card purple">
            <div className="stat-icon purple"><DollarSign size={22} /></div>
            <div className="stat-label">Laba Bersih Bulan Ini</div>
            <div className="stat-value">{formatRupiah(monthProfit)}</div>
            <div className="stat-sub">Margin: {monthMargin}% bulan ini</div>
          </div>
        )}
      </div>

      {/* Secondary Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Ongkir Ekspedisi</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{formatRupiah(today?.total_shipping || 0)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hari ini</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Biaya Modal (HPP) Hari Ini</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{formatRupiah(today?.total_cost || 0)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total modal barang keluar</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stok Perlu Restock</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{lowStockCount} Produk</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dari {totalProducts} produk aktif</div>
          </div>
        </div>
      </div>

      {/* Charts & Top Products */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <BarChart2 size={18} style={{ display: 'inline', marginRight: 8 }} />
              Tren Penjualan 7 Hari Terakhir
            </h2>
          </div>
          <div className="card-body" style={{ padding: '0 24px 20px' }}>
            <SimpleBarChart data={last7Days} />
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏆 Produk Terlaris Bulan Ini</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {topProducts?.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <p className="empty-title">Belum ada data</p>
              </div>
            ) : (
              <div>
                {topProducts?.map((p, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 24px',
                    borderBottom: idx < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: idx === 0 ? '#fff' : 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: idx === 0 ? '#000' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.product_name}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Omset: {formatRupiah(p.total_revenue)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.total_sold} terjual
                      </div>
                      {isAdmin && p.total_profit > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Laba: +{formatRupiah(p.total_profit)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Clock size={18} style={{ display: 'inline', marginRight: 8 }} />
            Transaksi Terbaru
          </h2>
        </div>
        <div className="table-wrapper">
          {recentTransactions?.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🧾</span>
              <p className="empty-title">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Waktu</th>
                  <th>Pengiriman</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Laba Bersih</th>}
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions?.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {t.invoice_number}
                    </td>
                    <td>{formatDate(t.created_at)}</td>
                    <td>
                      {t.shipping_cost > 0 ? (
                        <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Truck size={12} /> {t.shipping_name || 'Ekspedisi'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ambil di Toko</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right', fontWeight: 600, color: (t.profit || 0) >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                        +{formatRupiah(t.profit || 0)}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatRupiah(t.grand_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

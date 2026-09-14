import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import { formatRupiah, formatDateShort, formatDate } from '../utils/format';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  BarChart2, Clock, ArrowUpRight, DollarSign, Truck, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="empty-state">
      <span className="empty-icon">📊</span>
      <p className="empty-title">Belum ada data</p>
    </div>
  );

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div style={{ padding: '16px 0' }}>
      <div className="simple-bar-chart">
        {data.map((item, idx) => {
          const heightPct = (item.revenue / maxRevenue) * 100;
          return (
            <div key={idx} className="bar-item" title={`${formatDateShort(item.date)}: Omset ${formatRupiah(item.revenue)} | Laba ${formatRupiah(item.profit || 0)}`}>
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
      setData(res.data);
    } catch (err) {
      toast.error('Gagal memuat dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const { today, month, products, topProducts, last7Days, recentTransactions } = data || {};

  const todayRevenue = today?.total_revenue || 0;
  const todayProfit = today?.total_profit || 0;
  const todayMargin = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;

  const monthRevenue = month?.total_revenue || 0;
  const monthProfit = month?.total_profit || 0;
  const monthMargin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0;

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
          <div className="stat-sub">{today?.transaction_count || 0} transaksi</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple"><Wallet size={22} /></div>
          <div className="stat-label">Laba Bersih Hari Ini</div>
          <div className="stat-value">{formatRupiah(todayProfit)}</div>
          <div className="stat-sub">Margin: {todayMargin}% dari omset</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green"><ShoppingCart size={22} /></div>
          <div className="stat-label">Omset Bulan Ini</div>
          <div className="stat-value">{formatRupiah(monthRevenue)}</div>
          <div className="stat-sub">{month?.transaction_count || 0} transaksi</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple"><DollarSign size={22} /></div>
          <div className="stat-label">Laba Bersih Bulan Ini</div>
          <div className="stat-value">{formatRupiah(monthProfit)}</div>
          <div className="stat-sub">Margin: {monthMargin}% bulan ini</div>
        </div>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{products?.low_stock_count || 0} Produk</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dari {products?.total_products || 0} produk aktif</div>
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
                      {p.total_profit > 0 && (
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
                  <th style={{ textAlign: 'right' }}>Laba Bersih</th>
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
                    <td style={{ textAlign: 'right', fontWeight: 600, color: (t.profit || 0) >= 0 ? 'var(--text-primary)' : '#ff5555' }}>
                      +{formatRupiah(t.profit || 0)}
                    </td>
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

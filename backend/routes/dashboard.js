const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET dashboard summary
router.get('/summary', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Today's stats (revenue + profit)
    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as transaction_count,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COALESCE(AVG(grand_total), 0) as avg_transaction,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(shipping_cost), 0) as total_shipping
      FROM transactions
      WHERE DATE(created_at) = ?
    `).get(today);

    // This month's stats
    const monthStart = today.slice(0, 7) + '-01';
    const monthStats = db.prepare(`
      SELECT
        COUNT(*) as transaction_count,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(total_cost), 0) as total_cost
      FROM transactions
      WHERE DATE(created_at) >= ?
    `).get(monthStart);

    // Total products & low stock
    const productStats = db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN stock <= 10 AND is_active = 1 THEN 1 ELSE 0 END) as low_stock_count
      FROM products WHERE is_active = 1
    `).get();

    // Top selling products (this month)
    const topProducts = db.prepare(`
      SELECT
        ti.product_name,
        SUM(ti.quantity) as total_sold,
        SUM(ti.subtotal) as total_revenue,
        COALESCE(SUM(ti.profit), 0) as total_profit
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.created_at) >= ?
      GROUP BY ti.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `).all(monthStart);

    // Revenue + profit last 7 days
    const last7Days = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transactions,
        COALESCE(SUM(grand_total), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
      FROM transactions
      WHERE DATE(created_at) >= DATE('now', '-6 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Recent transactions
    const recentTransactions = db.prepare(`
      SELECT * FROM transactions
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        today: todayStats,
        month: monthStats,
        products: productStats,
        topProducts,
        last7Days,
        recentTransactions,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET chart data
router.get('/chart', (req, res) => {
  try {
    const { period = '7days' } = req.query;
    const days = period === '30days' ? 29 : 6;
    const data = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transactions,
        COALESCE(SUM(grand_total), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
      FROM transactions
      WHERE DATE(created_at) >= DATE('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

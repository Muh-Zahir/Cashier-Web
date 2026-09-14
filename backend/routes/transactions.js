const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.getTime().toString().slice(-6);
  return `INV-${date}-${time}`;
}

// GET all transactions (paginated)
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 20, date, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (date) {
      query += ' AND DATE(created_at) = ?';
      params.push(date);
    } else if (start_date && end_date) {
      query += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const transactions = db.prepare(query).all(...params);

    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE 1=1';
    const countParams = [];
    if (date) {
      countQuery += ' AND DATE(created_at) = ?';
      countParams.push(date);
    } else if (start_date && end_date) {
      countQuery += ' AND DATE(created_at) BETWEEN ? AND ?';
      countParams.push(start_date, end_date);
    }
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      data: transactions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single transaction with items
router.get('/:id', (req, res) => {
  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...transaction, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create transaction
router.post('/', (req, res) => {
  try {
    const {
      items,
      discount = 0,
      tax = 0,
      shipping_cost = 0,
      shipping_name = null,
      recipient_name = null,
      recipient_address = null,
      amount_paid,
      payment_method = 'cash',
      customer_type = 'regular',
      cashier_name = 'Admin',
      note,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    // Calculate totals
    let total = 0;
    let total_cost = 0;

    for (const item of items) {
      total += item.price * item.quantity;
      total_cost += (item.cost_price || 0) * item.quantity;
    }

    const discountAmount = discount > 0 && discount <= 100
      ? (total * discount / 100)
      : discount;
    const afterDiscount = total - discountAmount;
    const taxAmount = tax > 0 ? (afterDiscount * tax / 100) : 0;
    const shippingAmount = Number(shipping_cost) || 0;
    const grand_total = afterDiscount + taxAmount + shippingAmount;
    const profit = grand_total - total_cost - shippingAmount; // ongkir bukan laba toko
    const change_amount = amount_paid - grand_total;

    if (change_amount < 0) {
      return res.status(400).json({ success: false, error: 'Amount paid is insufficient' });
    }

    const invoice_number = generateInvoiceNumber();

    // Begin DB transaction
    const insertTransaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO transactions (
          invoice_number, customer_type, total, discount, tax,
          shipping_cost, shipping_name, recipient_name, recipient_address,
          grand_total, total_cost, profit,
          amount_paid, change_amount, payment_method, cashier_name, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice_number, customer_type || 'regular', total, discountAmount, taxAmount,
        shippingAmount, shipping_name, recipient_name, recipient_address,
        grand_total, total_cost, profit,
        amount_paid, change_amount, payment_method, cashier_name, note || null
      );

      const transactionId = result.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO transaction_items
          (transaction_id, product_id, product_name, product_price, product_cost, quantity, subtotal, profit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const itemSubtotal = item.price * item.quantity;
        const itemCost = (item.cost_price || 0) * item.quantity;
        const itemProfit = itemSubtotal - itemCost;
        insertItem.run(
          transactionId,
          item.product_id || null,
          item.name,
          item.price,
          item.cost_price || 0,
          item.quantity,
          itemSubtotal,
          itemProfit
        );
        // Reduce stock
        if (item.product_id) {
          db.prepare('UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(item.quantity, item.product_id);
        }
      }

      return transactionId;
    });

    const transactionId = insertTransaction();
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId);
    const transactionItems = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(transactionId);

    res.status(201).json({ success: true, data: { ...transaction, items: transactionItems } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Transaction not found' });
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

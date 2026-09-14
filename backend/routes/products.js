const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET all products
router.get('/', (req, res) => {
  try {
    const { category_id, search, active } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (active !== 'all') {
      query += ' AND p.is_active = 1';
    }
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY p.name ASC';

    const products = db.prepare(query).all(...params);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product
router.post('/', (req, res) => {
  try {
    const { name, price, cost_price = 0, reseller_price = 0, stock, category_id, emoji, barcode, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, error: 'Name and price are required' });
    }
    const result = db.prepare(`
      INSERT INTO products (name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, price, cost_price || 0, reseller_price || 0, stock || 0, category_id || null, emoji || '📦', barcode || null, description || null);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const { name, price, cost_price, reseller_price, stock, category_id, emoji, barcode, description, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found' });

    const activeValue = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE products SET
        name = ?, price = ?, cost_price = ?, reseller_price = ?, stock = ?, category_id = ?, emoji = ?,
        barcode = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? existing.name,
      price ?? existing.price,
      cost_price ?? existing.cost_price ?? 0,
      reseller_price ?? existing.reseller_price ?? 0,
      stock ?? existing.stock,
      category_id ?? existing.category_id,
      emoji ?? existing.emoji,
      barcode ?? existing.barcode,
      description ?? existing.description,
      activeValue,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH toggle product active status
router.patch('/:id/toggle-status', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const newStatus = product.is_active ? 0 : 1;
    db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, req.params.id);
    res.json({
      success: true,
      data: { ...product, is_active: newStatus },
      message: newStatus ? 'Produk berhasil diaktifkan kembali' : 'Produk dinonaktifkan',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update stock
router.patch('/:id/stock', (req, res) => {
  try {
    const { amount } = req.body; // positive = add, negative = subtract
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const newStock = product.stock + amount;
    if (newStock < 0) return res.status(400).json({ success: false, error: 'Insufficient stock' });

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, req.params.id);

    res.json({ success: true, data: { ...product, stock: newStock } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found' });
    db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all categories
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create category
router.post('/meta/categories', (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color || '#6366f1');
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { productsApi, transactionsApi } from '../api';
import useCartStore from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatRupiah } from '../utils/format';
import Modal from '../components/ui/Modal';
import {
  Search, Trash2, Plus, Minus, ShoppingCart, CreditCard,
  Banknote, X, Check, Printer, Truck, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ====== RECEIPT ======
function Receipt({ transaction, onClose }) {
  const handlePrint = () => window.print();
  const isDelivery = transaction.shipping_cost > 0;

  return (
    <Modal isOpen={true} onClose={onClose} title="Struk Pembayaran" size="lg">
      <div className="receipt" id="receipt-to-print">
        <div className="receipt-header">
          <div className="receipt-store-name">🛒 KasirPro</div>
          <div style={{ fontSize: 11, color: '#666' }}>Toko Serba Ada</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            {new Date(transaction.created_at).toLocaleString('id-ID')}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          {[
            ['No. Invoice', transaction.invoice_number],
            ['Pelanggan', transaction.customer_type === 'reseller' ? '🏷️ Reseller (Grosir)' : '👤 Pelanggan Umum'],
            ['Kasir', transaction.cashier_name],
            ...(isDelivery ? [
              ['Ekspedisi', transaction.shipping_name],
              ['Penerima', transaction.recipient_name],
              ['Alamat', transaction.recipient_address],
            ] : []),
          ].map(([label, value]) => (
            <div key={label} className="receipt-item-row" style={{ fontSize: 11 }}>
              <span>{label}</span>
              <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>

        <hr className="receipt-divider" />

        {transaction.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: 600 }}>{item.product_name}</div>
            <div className="receipt-item-row">
              <span style={{ color: '#666' }}>{item.quantity}x {formatRupiah(item.product_price)}</span>
              <span style={{ fontWeight: 600 }}>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}

        <hr className="receipt-divider" />
        <div className="receipt-item-row"><span>Subtotal</span><span>{formatRupiah(transaction.total)}</span></div>
        {transaction.discount > 0 && <div className="receipt-item-row"><span>Diskon</span><span>- {formatRupiah(transaction.discount)}</span></div>}
        {isDelivery && <div className="receipt-item-row"><span>Ongkir ({transaction.shipping_name})</span><span>{formatRupiah(transaction.shipping_cost)}</span></div>}
        <div className="receipt-total-row"><span>TOTAL</span><span>{formatRupiah(transaction.grand_total)}</span></div>

        <hr className="receipt-divider" />
        <div className="receipt-item-row"><span>Bayar</span><span>{formatRupiah(transaction.amount_paid)}</span></div>
        <div className="receipt-item-row" style={{ fontWeight: 700 }}><span>Kembalian</span><span>{formatRupiah(transaction.change_amount)}</span></div>

        <div className="receipt-footer">
          <p>Terima kasih atas kunjungan Anda! 🙏</p>
          {isDelivery && <p style={{ marginTop: 4, fontWeight: 700 }}>Pesanan akan dikirim via {transaction.shipping_name}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={onClose}><X size={16} /> Tutup</button>
        <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Cetak Struk</button>
      </div>
    </Modal>
  );
}

// ====== PAYMENT MODAL ======
function PaymentModal({ isOpen, onClose, total, onConfirm }) {
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setPaymentMethod('cash');
      setLoading(false);
    }
  }, [isOpen]);

  const amount = parseInt(amountStr.replace(/\D/g, '') || '0');
  const change = amount - total;

  const quickAmounts = [...new Set([
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
  ])].filter((v) => v > 0).slice(0, 4);

  function handleKeypad(val) {
    if (val === 'del') setAmountStr((p) => p.slice(0, -1));
    else if (val === '000') setAmountStr((p) => p + '000');
    else setAmountStr((p) => p + val);
  }

  function handleSelectMethod(m) {
    setPaymentMethod(m);
    if (m === 'transfer') {
      setAmountStr(String(total));
    }
  }

  async function handleConfirm() {
    if (amount < total) { toast.error('Uang bayar kurang dari total!'); return; }
    setLoading(true);
    try {
      await onConfirm({ amount_paid: amount, payment_method: paymentMethod });
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + (err?.message || 'Gagal'));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">💰 Proses Pembayaran</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Tagihan</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px' }}>{formatRupiah(total)}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[['cash', <Banknote size={15} />, 'Tunai'], ['transfer', <CreditCard size={15} />, 'Transfer']].map(([m, icon, label]) => (
              <button key={m} className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => handleSelectMethod(m)}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="payment-display">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Uang Diterima</div>
            <div className="payment-amount">{amount > 0 ? formatRupiah(amount) : 'Rp 0'}</div>
          </div>

          {amount > 0 && (
            <div className="payment-change" style={{ background: change < 0 ? 'rgba(240,163,163,0.08)' : undefined }}>
              <span className="label">Kembalian</span>
              <span className="value" style={{ color: change < 0 ? 'var(--danger)' : undefined }}>{formatRupiah(Math.max(0, change))}</span>
            </div>
          )}

          <div style={{ marginTop: 12, marginBottom: 4, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Jumlah Cepat</div>
          <div className="quick-amounts">
            {quickAmounts.map((a) => (
              <button key={a} className="quick-amount-btn" onClick={() => setAmountStr(String(a))}>{formatRupiah(a)}</button>
            ))}
          </div>

          <div className="payment-keypad">
            {['1','2','3','4','5','6','7','8','9','000','0','del'].map((k) => (
              <button key={k} className={`keypad-btn${k === 'del' ? ' backspace' : ''}`} onClick={() => handleKeypad(k)}>
                {k === 'del' ? '⌫' : k}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary btn-lg" onClick={handleConfirm} disabled={amount < total || loading} style={{ minWidth: 140 }}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Check size={16} /> Bayar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== EXPEDITION OPTIONS ======
const EKSPEDISI_LIST = [
  { name: 'JNE',          emoji: '🚚' },
  { name: 'J&T',          emoji: '🔴' },
  { name: 'SiCepat',      emoji: '⚡' },
  { name: 'Anteraja',     emoji: '🏍️' },
  { name: 'TIKI',         emoji: '📦' },
  { name: 'POS Indonesia',emoji: '🇮🇩' },
  { name: 'Ninja Xpress', emoji: '🥷' },
  { name: 'GoSend',       emoji: '🟢' },
  { name: 'GrabExpress',  emoji: '🟡' },
  { name: 'Lainnya',      emoji: '🚀' },
];

// ====== EXPEDITION DROPDOWN (ReactDOM portal — renders into document.body) ======
function ExpedisiDropdown({ triggerRef, onClose, selected, onSelect }) {
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 });
  const listRef = useRef(null);

  useEffect(() => {
    function calcPos() {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        // position:fixed → coordinates are already relative to viewport, no need for scrollY
        setPos({ top: r.bottom + 4, left: r.left, width: r.width });
      }
    }
    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [triggerRef]);

  useEffect(() => {
    function onMouseDown(e) {
      if (listRef.current && !listRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [onClose, triggerRef]);

  const dropdown = (
    <div
      ref={listRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: Math.max(pos.width, 150),
        zIndex: 2147483647,
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: 9,
        overflow: 'hidden',
        boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
        animation: 'fadeInDown 0.15s ease',
        maxHeight: 220,
        overflowY: 'auto',
      }}
    >
      {EKSPEDISI_LIST.map((exp) => {
        const isSel = selected === exp.name;
        return (
          <button
            key={exp.name}
            type="button"
            onClick={() => onSelect(exp.name)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', fontSize: 13, fontWeight: isSel ? 700 : 400,
              background: isSel ? '#6366f1' : 'transparent',
              color: isSel ? '#ffffff' : '#111827',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 15 }}>{exp.emoji}</span>
            <span>{exp.name}</span>
            {isSel && <Check size={13} style={{ marginLeft: 'auto', color: '#6366f1' }} />}
          </button>
        );
      })}
    </div>
  );

  return ReactDOM.createPortal(dropdown, document.body);
}

// ====== SHIPPING SECTION ======
function ShippingSection() {
  const { shippingEnabled, shippingCost, shippingName, recipientName, recipientAddress, toggleShipping, setShipping } = useCartStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const triggerRef = useRef(null);

  function handleToggle() {
    const next = !shippingEnabled;
    toggleShipping(next);
    setDropdownOpen(false);
    if (!next) setShipping({ shippingCost: 0, shippingName: '', recipientName: '', recipientAddress: '' });
  }

  const selectedExp = EKSPEDISI_LIST.find(e => e.name === shippingName);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
      {/* Toggle Header */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', background: shippingEnabled ? 'var(--accent-dim)' : 'transparent',
          border: 'none', cursor: 'pointer', transition: 'var(--transition)',
          borderRadius: shippingEnabled ? '10px 10px 0 0' : 10,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: shippingEnabled ? 'var(--white)' : 'var(--text-secondary)' }}>
          <Truck size={14} /> Kirim via Ekspedisi
        </span>
        <span style={{ fontSize: 11, color: shippingEnabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>
          {shippingEnabled ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Form */}
      {shippingEnabled && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

            {/* Custom Dropdown — uses fixed portal to escape overflow:hidden */}
            <div className="form-group">
              <label className="form-label">Ekspedisi</label>
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setDropdownOpen(p => !p)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', fontSize: 12, fontWeight: 600,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 7, color: selectedExp ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'var(--transition)',
                  boxShadow: dropdownOpen ? '0 0 0 2px var(--accent)' : 'none',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedExp
                    ? <>{selectedExp.emoji} {selectedExp.name}</>
                    : <span style={{ color: 'var(--text-muted)' }}>— Pilih —</span>}
                </span>
                <ChevronDown
                  size={13}
                  style={{ opacity: 0.6, transition: 'transform 0.2s', flexShrink: 0,
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {dropdownOpen && (
                <ExpedisiDropdown
                  triggerRef={triggerRef}
                  onClose={() => setDropdownOpen(false)}
                  selected={shippingName}
                  onSelect={(name) => { setShipping({ shippingName: name }); setDropdownOpen(false); }}
                />
              )}
            </div>

            {/* Ongkir — text input (no spinner arrows) */}
            <div className="form-group">
              <label className="form-label">Ongkir (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                style={{ fontSize: 12, padding: '7px 10px' }}
                placeholder="0"
                value={shippingCost || ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setShipping({ shippingCost: raw ? parseInt(raw, 10) : 0 });
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Penerima</label>
            <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }}
              placeholder="Nama lengkap penerima" value={recipientName}
              onChange={(e) => setShipping({ recipientName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Tujuan</label>
            <textarea className="form-textarea" style={{ fontSize: 12, padding: '7px 10px', minHeight: 56, resize: 'none' }}
              placeholder="Alamat lengkap pengiriman..." value={recipientAddress}
              onChange={(e) => setShipping({ recipientAddress: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ====== CART PANEL ======
function CartPanel({ onCheckout }) {
  const {
    items, removeItem, updateQuantity, clearCart,
    getSubtotal, getDiscountAmount, getShippingCost, getTotal, getProfit, getItemCount,
    discount, discountType, setDiscount, shippingEnabled, shippingCost, shippingName,
    customerType, setCustomerType,
  } = useCartStore();

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountTypeInput, setDiscountTypeInput] = useState('percent');

  const subtotal   = getSubtotal();
  const discountAmt = getDiscountAmount();
  const shippingAmt = getShippingCost();
  const total      = getTotal();
  const profit     = getProfit();
  const count      = getItemCount();

  function applyDiscount() {
    const val = parseFloat(discountInput) || 0;
    setDiscount(val, discountTypeInput);
    setShowDiscount(false);
  }

  const profitMargin = subtotal - discountAmt > 0 ? ((profit / (subtotal - discountAmt)) * 100).toFixed(1) : 0;

  return (
    <div className="cart-panel">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-title">
          <ShoppingCart size={16} />
          Keranjang
          {count > 0 && <span className="cart-count">{count}</span>}
        </div>
        {items.length > 0 && (
          <button className="btn btn-danger btn-sm btn-icon" onClick={clearCart} title="Kosongkan keranjang">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Customer Type Selector (Umum vs Reseller) */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Tipe Harga
          </span>
          {customerType === 'reseller' && (
            <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 6px' }}>
              Mode Reseller Aktif
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${customerType === 'regular' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '6px 8px', justifyContent: 'center' }}
            onClick={() => setCustomerType('regular')}
          >
            👤 Umum
          </button>
          <button
            type="button"
            className={`btn btn-sm ${customerType === 'reseller' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '6px 8px', justifyContent: 'center' }}
            onClick={() => setCustomerType('reseller')}
          >
            🏷️ Reseller
          </button>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Keranjang kosong</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pilih produk untuk ditambahkan</p>
        </div>
      ) : (
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-emoji">{item.emoji}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{formatRupiah(item.price)}</div>
              </div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={11} /></button>
                <span className="qty-display">{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={11} /></button>
              </div>
              <div className="cart-item-subtotal">{formatRupiah(item.price * item.quantity)}</div>
              <button className="btn btn-danger btn-sm btn-icon" style={{ width: 22, height: 22, borderRadius: 5 }} onClick={() => removeItem(item.id)}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {items.length > 0 && (
        <div className="cart-footer">
          {/* Totals */}
          <div className="cart-totals">
            <div className="total-row">
              <span className="label">Subtotal</span>
              <span className="value">{formatRupiah(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="total-row">
                <span className="label" style={{ color: 'var(--success)' }}>Diskon {discountType === 'percent' ? `${discount}%` : ''}</span>
                <span className="value" style={{ color: 'var(--success)' }}>- {formatRupiah(discountAmt)}</span>
              </div>
            )}
            {shippingEnabled && shippingAmt > 0 && (
              <div className="total-row">
                <span className="label" style={{ color: 'var(--info)' }}>
                  <Truck size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Ongkir {shippingName ? `(${shippingName})` : ''}
                </span>
                <span className="value" style={{ color: 'var(--info)' }}>+ {formatRupiah(shippingAmt)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span className="label">Total</span>
              <span className="value">{formatRupiah(total)}</span>
            </div>

            {/* Profit estimate */}
            {profit > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', background: 'rgba(163,230,199,0.08)',
                border: '1px solid rgba(163,230,199,0.15)', borderRadius: 8, marginTop: 2,
              }}>
                <span style={{ fontSize: 11.5, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                  <TrendingUp size={12} /> Est. Laba
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>{formatRupiah(profit)}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>({profitMargin}%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Shipping */}
          <ShippingSection />

          {/* Discount */}
          {showDiscount ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <select className="form-select" style={{ width: 70, padding: '7px 8px', fontSize: 12 }}
                value={discountTypeInput} onChange={(e) => setDiscountTypeInput(e.target.value)}>
                <option value="percent">%</option>
                <option value="fixed">Rp</option>
              </select>
              <input type="number" className="form-input" style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                placeholder={discountTypeInput === 'percent' ? '0–100' : 'Nominal'}
                value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={applyDiscount}>✓</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowDiscount(false); setDiscount(0); }}>✕</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setShowDiscount(true)}>
              🏷️ Tambah Diskon
            </button>
          )}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCheckout}>
            <CreditCard size={15} /> Proses Pembayaran
          </button>
        </div>
      )}
    </div>
  );
}

// ====== MAIN POS PAGE ======
export default function POSPage() {
  const { user } = useAuthStore();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt]     = useState(null);

  const { addItem, items, getTotal, shippingEnabled, shippingName, shippingCost, recipientName, recipientAddress } = useCartStore();
  const searchRef = useRef(null);

  useEffect(() => {
    loadData();
    searchRef.current?.focus();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([productsApi.getAll(), productsApi.getCategories()]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Gagal memuat produk: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function handleCheckout({ amount_paid, payment_method }) {
    const state = useCartStore.getState();
    const cartItems = state.items;

    try {
      const res = await transactionsApi.create({
        items: cartItems.map((i) => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          cost_price: i.cost_price || 0,
          quantity: i.quantity,
        })),
        customer_type: state.customerType || 'regular',
        discount: state.getDiscountAmount(),
        shipping_cost: state.shippingEnabled ? (state.shippingCost || 0) : 0,
        shipping_name: state.shippingEnabled ? state.shippingName : null,
        recipient_name: state.shippingEnabled ? state.recipientName : null,
        recipient_address: state.shippingEnabled ? state.recipientAddress : null,
        amount_paid,
        payment_method,
        cashier_name: user?.name || 'Kasir',
      });

      state.clearCart();
      setShowPayment(false);
      setReceipt(res?.data || res);
      toast.success('✅ Transaksi berhasil!');
      await loadData();
    } catch (err) {
      toast.error('Gagal memproses transaksi: ' + err.message);
    }
  }

  const { customerType } = useCartStore();

  return (
    <div className="pos-layout">
      {/* Products Panel */}
      <div className="pos-products-panel">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input ref={searchRef} type="text" className="form-input"
            placeholder="Cari produk..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="category-tabs">
          <button className={`category-tab${selectedCategory === 'all' ? ' active' : ''}`} onClick={() => setSelectedCategory('all')}>
            Semua
          </button>
          {categories.map((cat) => (
            <button key={cat.id} className={`category-tab${selectedCategory === cat.id ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p className="empty-title">Produk tidak ditemukan</p>
            <p className="empty-text">Coba kata kunci yang berbeda</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= 10;
              const isResellerMode = customerType === 'reseller';
              const hasResellerPrice = product.reseller_price > 0;
              const activePrice = isResellerMode && hasResellerPrice ? product.reseller_price : product.price;

              return (
                <div key={product.id} className={`product-card${isOut ? ' out-of-stock' : ''}`}
                  onClick={() => !isOut && addItem({ ...product, id: product.id })}>
                  <div className="product-emoji">{product.emoji}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price" style={{ color: isResellerMode && hasResellerPrice ? 'var(--accent)' : undefined }}>
                    {formatRupiah(activePrice)}
                  </div>
                  {hasResellerPrice && (
                    <div style={{
                      fontSize: 10,
                      marginTop: -4,
                      marginBottom: 6,
                      color: isResellerMode ? 'var(--text-muted)' : 'var(--text-secondary)',
                    }}>
                      {isResellerMode ? `Biasa: ${formatRupiah(product.price)}` : `Reseller: ${formatRupiah(product.reseller_price)}`}
                    </div>
                  )}
                  <span className={`product-stock-badge ${isOut ? 'out' : isLow ? 'low-stock' : 'in-stock'}`}>
                    {isOut ? 'Habis' : isLow ? `Sisa ${product.stock}` : `Stok ${product.stock}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <CartPanel onCheckout={() => items.length > 0 && setShowPayment(true)} />

      {/* Payment Modal */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} total={getTotal()} onConfirm={handleCheckout} />

      {/* Receipt */}
      {receipt && <Receipt transaction={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

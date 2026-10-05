import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { PRICE_LABELS } from '../config/clientConfig';

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
            ['Tipe Harga', transaction.customer_type === 'reseller' ? PRICE_LABELS.specialCustomer : PRICE_LABELS.regularCustomer],
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
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total Tagihan</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px' }}>{formatRupiah(total)}</div>
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
                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
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
function CartPanel({ onCheckout, mobileOpen = false, onCloseMobile }) {
  const {
    items, removeItem, updateQuantity, clearCart,
    getSubtotal, getDiscountAmount, getShippingCost, getTotal, getProfit, getItemCount,
    discount, discountType, setDiscount, shippingEnabled, shippingCost, shippingName,
    customerType, setCustomerType,
  } = useCartStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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
    <>
      {mobileOpen && (
        <div className="cart-backdrop" onClick={onCloseMobile} />
      )}
      <div className={`cart-panel${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-title">
            <ShoppingCart size={16} />
            Keranjang
            {count > 0 && <span className="cart-count">{count}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {items.length > 0 && (
              <button className="btn btn-danger btn-sm btn-icon" onClick={clearCart} title="Kosongkan keranjang">
                <Trash2 size={13} />
              </button>
            )}
            <button
              type="button"
              className="mobile-cart-close-btn"
              onClick={onCloseMobile}
              title="Tutup Keranjang"
              aria-label="Tutup Keranjang"
            >
              <X size={16} />
            </button>
          </div>
        </div>

      {/* Customer Type Selector */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Tipe Harga
          </span>
          {customerType === 'reseller' && (
            <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 6px' }}>
              {PRICE_LABELS.specialModeActive}
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
            {PRICE_LABELS.regularBadge}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${customerType === 'reseller' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '6px 8px', justifyContent: 'center' }}
            onClick={() => setCustomerType('reseller')}
          >
            {PRICE_LABELS.specialBadge}
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
          {items.map((item) => {
            const isMax = typeof item.stock === 'number' && item.quantity >= item.stock;
            return (
              <div key={item.id} className="cart-item-card">
                {/* Baris 1: Emoji, Nama Lengkap, Article/Kode, Tombol Hapus */}
                <div className="cart-item-top">
                  <div className="cart-item-emoji">{item.emoji || '📦'}</div>
                  <div className="cart-item-header-info">
                    <div className="cart-item-name" title={item.name}>{item.name}</div>
                    {item.barcode && (
                      <div className="cart-item-article">🏷️ {item.barcode}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="cart-item-delete-btn"
                    onClick={() => removeItem(item.id)}
                    title="Hapus dari keranjang"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Baris 2: Harga & Stok di kiri, Qty Controls & Subtotal di kanan */}
                <div className="cart-item-bottom">
                  <div className="cart-item-meta">
                    <span className="cart-item-unit-price">{formatRupiah(item.price)}</span>
                    {typeof item.stock === 'number' && (
                      <span className={`cart-item-stock-tag${isMax ? ' max' : ''}`}>
                        {isMax ? `Maks (${item.stock})` : `Sisa ${item.stock}`}
                      </span>
                    )}
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        title="Kurangi"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        disabled={isMax}
                        style={isMax ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                        title={isMax ? `Stok maksimal tercapai (${item.stock})` : 'Tambah jumlah'}
                        onClick={() => {
                          const res = updateQuantity(item.id, item.quantity + 1);
                          if (res && !res.success && res.reason === 'max_stock_reached') {
                            toast.error(`Stok "${item.name}" hanya tersedia ${item.stock}!`, { id: `stock-${item.id}` });
                          }
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="cart-item-subtotal">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

            {/* Profit estimate — admin only */}
            {isAdmin && profit > 0 && (
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
              <select className="form-select" style={{ width: 84, padding: '7px 26px 7px 10px', backgroundPosition: 'calc(100% - 8px) center', fontSize: 12 }}
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
    </>
  );
}

const KNOWN_BRANDS = ['Broco', 'Uticon', 'Eterna', 'Panasonic', 'Schneider', 'Philips'];

function getCategoryBrand(catName) {
  if (!catName) return 'Lainnya';
  for (const b of KNOWN_BRANDS) {
    if (new RegExp(b, 'i').test(catName)) return b;
  }
  return catName;
}

// ====== MAIN POS PAGE ======
export default function POSPage() {
  const { user } = useAuthStore();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt]     = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const { addItem, updateQuantity, items, getTotal, shippingEnabled, shippingName, shippingCost, recipientName, recipientAddress } = useCartStore();
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

  // Daftar merek unik dari kategori yang tersedia
  const availableBrands = useMemo(() => {
    const brandsSet = new Set();
    categories.forEach((cat) => {
      brandsSet.add(getCategoryBrand(cat.name));
    });
    return Array.from(brandsSet);
  }, [categories]);

  // Hitung jumlah produk per merek
  const brandProductCounts = useMemo(() => {
    const counts = { all: products.length };
    availableBrands.forEach((b) => {
      counts[b] = products.filter((p) => {
        const cat = categories.find((c) => c.id === p.category_id);
        const bName = cat ? getCategoryBrand(cat.name) : 'Lainnya';
        return bName === b;
      }).length;
    });
    return counts;
  }, [products, categories, availableBrands]);

  // Sub-kategori untuk merek yang sedang dipilih
  const activeBrandCategories = useMemo(() => {
    if (selectedBrand === 'all') return [];
    return categories.filter((c) => getCategoryBrand(c.name) === selectedBrand);
  }, [categories, selectedBrand]);

  // Label sub-kategori bersih (e.g. "Broco Standard" -> "Standard", "Kabel Eterna" -> "Kabel")
  function getSubcategoryLabel(catName, brand) {
    if (!catName || !brand) return catName;
    const cleaned = catName.replace(new RegExp(brand, 'i'), '').trim();
    return cleaned || catName;
  }

  const filteredProducts = products.filter((p) => {
    const cat = categories.find((c) => c.id === p.category_id);
    const pBrand = cat ? getCategoryBrand(cat.name) : 'Lainnya';

    const matchBrand = selectedBrand === 'all' || pBrand === selectedBrand;
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const sLower = search.toLowerCase();
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(sLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(sLower));

    return matchBrand && matchCat && matchSearch;
  });

  async function handleCheckout({ amount_paid, payment_method }) {
    const state = useCartStore.getState();
    const cartItems = state.items;

    try {
      const res = await transactionsApi.create({
        items: cartItems.map((i) => ({
          id: i.id,           // product id untuk update stok
          product_id: i.id,   // fallback
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
            placeholder={PRICE_LABELS.searchPlaceholder || "Cari produk atau article..."} value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Filter per Merek & Seri */}
        <div className="brand-filter-wrapper">
          <div className="brand-tabs">
            <button
              type="button"
              className={`brand-tab${selectedBrand === 'all' ? ' active' : ''}`}
              onClick={() => {
                setSelectedBrand('all');
                setSelectedCategory('all');
              }}
            >
              🏷️ Semua Merek
              <span className="brand-tab-count">{brandProductCounts.all || 0}</span>
            </button>
            {availableBrands.map((brand) => (
              <button
                type="button"
                key={brand}
                className={`brand-tab${selectedBrand === brand ? ' active' : ''}`}
                onClick={() => {
                  setSelectedBrand(brand);
                  setSelectedCategory('all');
                }}
              >
                {brand}
                {brandProductCounts[brand] !== undefined && (
                  <span className="brand-tab-count">{brandProductCounts[brand]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Sub-series pills jika merek memiliki beberapa sub-kategori/seri */}
          {activeBrandCategories.length > 1 && (
            <div className="sub-category-tabs">
              <span className="sub-category-label">Seri:</span>
              <button
                type="button"
                className={`sub-category-pill${selectedCategory === 'all' ? ' active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                Semua {selectedBrand}
              </button>
              {activeBrandCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`sub-category-pill${selectedCategory === cat.id ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {getSubcategoryLabel(cat.name, selectedBrand)}
                </button>
              ))}
            </div>
          )}
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
          <div className="pos-product-list">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= 10;
              const isResellerMode = customerType === 'reseller';
              const hasResellerPrice = product.reseller_price > 0;
              const activePrice = isResellerMode && hasResellerPrice ? product.reseller_price : product.price;

              const inCartItem = items.find((i) => i.id === product.id);
              const inCartQty = inCartItem ? inCartItem.quantity : 0;
              const isCartFull = product.stock > 0 && inCartQty >= product.stock;

              function handleAdd() {
                if (isOut) {
                  toast.error(`Produk "${product.name}" sudah habis!`, { id: `stock-${product.id}` });
                  return;
                }
                if (isCartFull) {
                  toast.error(`Semua stok "${product.name}" (${product.stock}) sudah ada di keranjang!`, { id: `stock-${product.id}` });
                  return;
                }
                const res = addItem({ ...product, id: product.id });
                if (res && !res.success) {
                  if (res.reason === 'max_stock_reached') {
                    toast.error(`Stok "${product.name}" hanya tersedia ${product.stock}!`, { id: `stock-${product.id}` });
                  } else if (res.reason === 'out_of_stock') {
                    toast.error(`Produk "${product.name}" sudah habis!`, { id: `stock-${product.id}` });
                  }
                }
              }

              return (
                <div
                  key={product.id}
                  className={`pos-list-row${isOut ? ' out-of-stock' : ''}${isCartFull ? ' cart-full' : ''}`}
                >
                  {/* Left: emoji + info */}
                  <div className="pos-list-identity" onClick={!isOut && !isCartFull ? handleAdd : undefined}>
                    <span className="pos-list-emoji">{product.emoji}</span>
                    <div className="pos-list-info">
                      <div className="pos-list-name">{product.name}</div>
                      <div className="pos-list-meta">
                        {product.barcode && (
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)' }}>
                            🏷️ {product.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: price + stock */}
                  <div className="pos-list-center" onClick={!isOut && !isCartFull ? handleAdd : undefined}>
                    <div className="pos-list-price" style={{ color: isResellerMode && hasResellerPrice ? 'var(--accent)' : undefined }}>
                      {formatRupiah(activePrice)}
                    </div>
                    {hasResellerPrice && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {isResellerMode
                          ? PRICE_LABELS.priceCatalogRegular(formatRupiah(product.price))
                          : PRICE_LABELS.priceCatalogSpecial(formatRupiah(product.reseller_price))}
                      </div>
                    )}
                    <span className={`product-stock-badge ${isOut ? 'out' : isLow ? 'low-stock' : 'in-stock'}`} style={{ marginTop: 3, display: 'inline-block' }}>
                      {isOut ? 'Habis' : isLow ? `Sisa ${product.stock}` : `Stok ${product.stock}`}
                    </span>
                  </div>

                  {/* Right: add button or qty stepper */}
                  <div className="pos-list-action">
                    {inCartQty > 0 ? (
                      <div className="pos-list-stepper">
                        <button
                          type="button"
                          className="pos-stepper-btn"
                          onClick={() => updateQuantity(product.id, inCartQty - 1)}
                          title="Kurangi"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="pos-stepper-qty">{inCartQty}</span>
                        <button
                          type="button"
                          className="pos-stepper-btn"
                          disabled={isCartFull}
                          style={isCartFull ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                          onClick={() => {
                            const res = updateQuantity(product.id, inCartQty + 1);
                            if (res && !res.success && res.reason === 'max_stock_reached') {
                              toast.error(`Stok "${product.name}" hanya tersedia ${product.stock}!`, { id: `stock-${product.id}` });
                            }
                          }}
                          title={isCartFull ? `Stok maks (${product.stock})` : 'Tambah'}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pos-add-btn"
                        disabled={isOut}
                        onClick={handleAdd}
                        title={isOut ? 'Stok habis' : `Tambah ${product.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </div>

      {/* Mobile Floating Cart Bar */}
      <div
        className={`pos-mobile-cart-bar${items.length > 0 ? ' has-items' : ''}`}
        onClick={() => setMobileCartOpen(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pos-mobile-cart-badge">
            <ShoppingCart size={18} />
            {items.length > 0 && (
              <span className="pos-mobile-cart-count">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)' }}>
              {formatRupiah(getTotal())}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {items.length} jenis item di keranjang
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
          onClick={(e) => {
            e.stopPropagation();
            setMobileCartOpen(true);
          }}
        >
          Keranjang & Bayar →
        </button>
      </div>

      {/* Cart */}
      <CartPanel
        mobileOpen={mobileCartOpen}
        onCloseMobile={() => setMobileCartOpen(false)}
        onCheckout={() => {
          setMobileCartOpen(false);
          items.length > 0 && setShowPayment(true);
        }}
      />

      {/* Payment Modal */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} total={getTotal()} onConfirm={handleCheckout} />

      {/* Receipt */}
      {receipt && <Receipt transaction={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

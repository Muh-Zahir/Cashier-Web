import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, ClipboardList, LayoutDashboard, Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export default function MobileBottomNav({ onOpenMenu }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <nav className="mobile-bottom-nav">
      {isAdmin && (
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>
      )}

      <NavLink
        to="/pos"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingCart size={19} />
          {itemCount > 0 && (
            <span className="bottom-nav-badge">{itemCount}</span>
          )}
        </div>
        <span>Kasir</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <Package size={19} />
        <span>Produk</span>
      </NavLink>

      <NavLink
        to="/transactions"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <ClipboardList size={19} />
        <span>Transaksi</span>
      </NavLink>

      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenMenu}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <Menu size={19} />
        <span>Menu</span>
      </button>
    </nav>
  );
}

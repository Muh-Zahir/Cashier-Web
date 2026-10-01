import React from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function MobileHeader({ onOpenMenu }) {
  const { user } = useAuthStore();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMenu}
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>
        <div className="mobile-header-brand">
          <span className="mobile-header-logo">🛒</span>
          <span className="mobile-header-title">KasirPro</span>
        </div>
      </div>

      {user && (
        <div className="mobile-header-user" onClick={onOpenMenu}>
          <span className={`badge badge-${user.role === 'admin' ? 'purple' : 'info'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
            {user.role === 'admin' ? 'Admin' : 'Kasir'}
          </span>
          <div className="mobile-user-avatar">
            {getInitials(user.name)}
          </div>
        </div>
      )}
    </header>
  );
}

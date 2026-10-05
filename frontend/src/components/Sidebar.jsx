import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  LogOut,
  User as UserIcon,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import Modal from './ui/Modal';
import toast from 'react-hot-toast';

// Semua menu beserta role yang diizinkan
const NAV_SECTIONS = [
  {
    label: 'Administrasi',
    roles: ['admin'],
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Operasional',
    roles: ['admin', 'cashier'],
    items: [
      { to: '/pos', icon: ShoppingCart, label: 'Kasir (POS)' },
      { to: '/products', icon: Package, label: 'Produk & Stok' },
      { to: '/transactions', icon: ClipboardList, label: 'Transaksi' },
    ],
  },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="sidebar-time">
      <span className="time">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="date">
        {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Berhasil keluar. Sampai jumpa!');
      navigate('/login');
    } catch (err) {
      toast.error('Gagal logout: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen?.(false)} />
      )}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-wrapper">
            <div className="logo-icon">🛒</div>
            <div className="logo-text">
              <span className="logo-title">KasirPro</span>
              <span className="logo-subtitle">Point of Sale System</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen?.(false)}
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS
            .filter((section) => section.roles.includes(user?.role))
            .map((section) => (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen?.(false)}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    {label}
                  </NavLink>
                ))}
              </div>
            ))
          }
        </nav>

        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isLight ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              transition: 'var(--transition)',
              marginBottom: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-subtle-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {isLight
              ? <Moon size={15} style={{ flexShrink: 0 }} />
              : <Sun size={15} style={{ flexShrink: 0 }} />
            }
            <span>{isLight ? 'Mode Gelap' : 'Mode Terang'}</span>
            <span style={{
              marginLeft: 'auto',
              width: 34,
              height: 18,
              borderRadius: 9,
              background: isLight ? 'var(--border-strong)' : 'rgba(255,255,255,0.18)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute',
                top: 2,
                left: isLight ? 18 : 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--text-primary)',
                transition: 'left 0.2s',
              }} />
            </span>
          </button>

          <Clock />

          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  {getInitials(user.name)}
                </div>
                <div className="sidebar-user-details">
                  <div className="sidebar-user-name" title={user.name}>
                    {user.name}
                  </div>
                  <span className={`sidebar-user-role ${user.role || 'cashier'}`}>
                    {user.role === 'admin' ? 'Admin' : 'Kasir'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="sidebar-logout-btn"
                title="Keluar / Logout"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        title="Konfirmasi Logout"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Mengeluarkan...' : 'Ya, Keluar'}
            </button>
          </>
        }
      >
        <div style={{ padding: '8px 0', textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LogOut size={26} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--white)' }}>
            Akhiri Sesi Kasir?
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Anda saat ini login sebagai <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>.
            Apakah Anda yakin ingin keluar dari aplikasi?
          </p>
        </div>
      </Modal>
    </>
  );
}


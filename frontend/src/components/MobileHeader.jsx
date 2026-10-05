import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Shield, X, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MobileHeader() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const popupRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Close popup when clicking outside
  useEffect(() => {
    if (!showProfile) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showProfile]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Berhasil keluar. Sampai jumpa!');
      navigate('/login');
    } catch (err) {
      toast.error('Gagal logout: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsLoggingOut(false);
      setShowProfile(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <div className="mobile-header-brand">
          <span className="mobile-header-logo">🛒</span>
          <span className="mobile-header-title">KasirPro</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isLight ? 'Mode Gelap' : 'Mode Terang'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)',
            flexShrink: 0,
          }}
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

      {user && (
        <div style={{ position: 'relative' }} ref={popupRef}>
          {/* Avatar Button */}
          <button
            type="button"
            className="mobile-avatar-btn"
            onClick={() => setShowProfile((v) => !v)}
            aria-label="Profil"
          >
            <div className="mobile-user-avatar">
              {getInitials(user.name)}
            </div>
          </button>

          {/* Profile Popup */}
          {showProfile && (
            <div className="mobile-profile-popup">
              {/* Header popup */}
              <div className="mpp-header">
                <div className="mpp-avatar">
                  {getInitials(user.name)}
                </div>
                <div className="mpp-info">
                  <div className="mpp-name">{user.name}</div>
                  <div className="mpp-role-badge" data-role={user.role}>
                    {isAdmin ? <Shield size={11} /> : <User size={11} />}
                    {isAdmin ? 'Administrator' : 'Kasir'}
                  </div>
                </div>
                <button
                  type="button"
                  className="mpp-close"
                  onClick={() => setShowProfile(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detail info */}
              <div className="mpp-body">
                <div className="mpp-detail-row">
                  <span className="mpp-detail-label">Username</span>
                  <span className="mpp-detail-value">{user.username || user.name}</span>
                </div>
                <div className="mpp-detail-row">
                  <span className="mpp-detail-label">Role</span>
                  <span className="mpp-detail-value" style={{ textTransform: 'capitalize' }}>
                    {user.role === 'admin' ? 'Admin' : 'Kasir'}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <div className="mpp-footer">
                <button
                  type="button"
                  className="mpp-logout-btn"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut size={15} />
                  {isLoggingOut ? 'Keluar...' : 'Keluar / Logout'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </header>
  );
}

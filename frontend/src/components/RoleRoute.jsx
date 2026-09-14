import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldOff } from 'lucide-react';

/**
 * RoleRoute - Route guard berbasis role pengguna.
 * 
 * @param {string[]} allowedRoles - Daftar role yang boleh mengakses route ini (e.g., ['admin'])
 * @param {ReactNode} children - Konten halaman yang dilindungi
 */
export default function RoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-root)',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  // Belum login → arahkan ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Sudah login tapi role tidak diizinkan → tampilkan halaman 403
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-root)',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShieldOff size={30} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)', marginBottom: 8, letterSpacing: '-0.3px' }}>
            Akses Ditolak
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
            Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator toko Anda untuk informasi lebih lanjut.
          </p>
        </div>
        <a
          href="/pos"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 8 }}
        >
          ← Kembali ke Kasir
        </a>
      </div>
    );
  }

  return children;
}

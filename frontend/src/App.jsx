import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import TransactionsPage from './pages/TransactionsPage';
import { useAuthStore } from './store/useAuthStore';
import './index.css';

function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect root to /pos */}
        <Route path="/" element={<Navigate to="/pos" replace />} />

        {/* Protected: semua role */}
        <Route
          path="/pos"
          element={
            <DashboardLayout>
              <POSPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/transactions"
          element={
            <DashboardLayout>
              <TransactionsPage />
            </DashboardLayout>
          }
        />

        {/* Protected: Admin only */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <RoleRoute allowedRoles={['admin']}>
                <DashboardPage />
              </RoleRoute>
            </DashboardLayout>
          }
        />
        <Route
          path="/products"
          element={
            <DashboardLayout>
              <ProductsPage />
            </DashboardLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161616',
            color: '#f4f4f5',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: { primary: '#fff', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#f0a3a3', secondary: '#161616' },
          },
        }}
      />
    </BrowserRouter>
  );
}


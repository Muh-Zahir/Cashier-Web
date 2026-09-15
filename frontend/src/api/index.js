import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kasirpro_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('kasirpro_token');
      localStorage.removeItem('kasirpro_user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || 'Terjadi kesalahan';
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Products API
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id) => api.patch(`/products/${id}/toggle-status`),
  updateStock: (id, amount) => api.patch(`/products/${id}/stock`, { amount }),
  getCategories: () => api.get('/products/meta/categories'),
  createCategory: (data) => api.post('/products/meta/categories', data),
};

// Transactions API
export const transactionsApi = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getChart: (period) => api.get('/dashboard/chart', { params: { period } }),
};

export default api;

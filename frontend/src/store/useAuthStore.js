import { create } from 'zustand';
import { authApi } from '../api';

const TOKEN_KEY = 'kasirpro_token';
const USER_KEY = 'kasirpro_user';

const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  loading: true,

  // Login action
  login: async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token, user } = res;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      loading: false,
    });

    return user;
  },

  // Logout action
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  // Check auth session on startup
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, loading: false });
      return;
    }

    try {
      const res = await authApi.getMe();
      const user = res.user || res.data?.user || res;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (err) {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },
}));

export { useAuthStore };
export default useAuthStore;

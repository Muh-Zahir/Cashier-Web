import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // default

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      initTheme: () => {
        applyTheme(get().theme);
      },
    }),
    {
      name: 'kasirpro-theme',
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);

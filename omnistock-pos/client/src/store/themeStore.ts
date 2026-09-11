import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  accentColor: string; // Hex color
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      accentColor: '#10b981', // Default emerald-500
      setMode: (mode) => set({ mode }),
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: 'omnistock-theme',
    }
  )
);

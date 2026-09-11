import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  nombre_completo: string;
  rol: string;
}

interface Terminal {
  id: number;
  nombre: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  terminal: Terminal | null; // Objeto completo de la Caja
  setAuth: (token: string, user: User) => void;
  setTerminal: (terminal: Terminal | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      terminal: null,
      setAuth: (token, user) => set({ token, user }),
      setTerminal: (terminal) => set({ terminal }),
      logout: () => set({ token: null, user: null, terminal: null }),
    }),
    {
      name: 'omnistock-auth',
    }
  )
);

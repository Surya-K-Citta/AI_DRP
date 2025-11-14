// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  udyamNumber?: string;
  location?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (userData) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          isAuthenticated: !!(state.user && state.token),
        })),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state, error) => {
        // After rehydration, sync isAuthenticated with token and user
        // Note: We can't modify state here, but ProtectedRoute will check token/user directly
        if (state && !error) {
          // The state is already hydrated, ProtectedRoute will verify token/user
        }
      },
    }
  )
);


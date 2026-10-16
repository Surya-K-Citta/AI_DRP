// @ts-nocheck
import { create } from 'zustand';
import { clearUserSession } from '@/lib/sessionReset';
import { persist } from 'zustand/middleware';
import { useSessionClock } from '@/lib/sessionClock';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  reviewDistrict?: string;
  udyamNumber?: string;
  location?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  privacy?: {
    noticeVersion?: string | null;
    accountConsent?: boolean;
    aiAssist?: boolean;
    analytics?: boolean;
    needsNoticeAcceptance?: boolean;
    nominee?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };
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
        useSessionClock.getState().setToken(token);
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        useSessionClock.getState().reset();
        // Nothing from this session may be visible to the next person who signs in on this browser.
        clearUserSession();
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


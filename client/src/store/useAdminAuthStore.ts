import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../api/auth';

export type { User };

interface AdminAuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginUser: (user: User, token?: string) => void;
  logoutUser: () => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loginUser: (user) =>
        set({
          user,
          token: null, // Tokens are stored exclusively in secure HttpOnly cookies, not in browser storage
          isAuthenticated: true,
        }),
      logoutUser: () => set({ user: null, token: null, isAuthenticated: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'admin-auth-storage',
      // SEC-HIGH-003: Persist only non-sensitive user metadata for UI rendering.
      // JWT access tokens are NEVER stored in localStorage to prevent XSS exfiltration.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

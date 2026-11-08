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
      loginUser: (user, token) =>
        set({
          user,
          token: token || (user as any)?.accessToken || null,
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
    }
  )
);

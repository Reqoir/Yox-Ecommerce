import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../api/auth';

export type { User };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  logout: () => void;
  setAuthData: (user: User, token?: string) => void;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loginUser: (user) => set({ user, isAuthenticated: true }),
      logoutUser: () => set({ user: null, isAuthenticated: false }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setAuthData: (user, _token) => set({ user, isAuthenticated: true }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginUser: (user: User) => void;
  logoutUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loginUser: (user) => set({ user, isAuthenticated: true }),
      logoutUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

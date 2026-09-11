import { create } from 'zustand';

export type AuthModalMode = 'login' | 'register' | 'forgot-password';

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  redirectUrl: string | null;
  openModal: (mode?: AuthModalMode, redirectUrl?: string) => void;
  closeModal: () => void;
  setMode: (mode: AuthModalMode) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  redirectUrl: null,
  openModal: (mode = 'login', redirectUrl: string | null = null) =>
    set({ isOpen: true, mode, redirectUrl }),
  closeModal: () => set({ isOpen: false, redirectUrl: null }),
  setMode: (mode) => set({ mode }),
}));

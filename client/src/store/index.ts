/**
 * @file store/index.ts
 * @description Zustand store root.
 *
 * Feature slices will be created separately per module.
 * Only global UI state belongs here (e.g., sidebar open/close, theme).
 *
 * Pattern for adding a slice:
 *   import { createUserSlice, UserSlice } from '@/modules/users/store/user.slice';
 *   export const useStore = create<UserSlice>(...)(...createUserSlice);
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GlobalUIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useGlobalStore = create<GlobalUIState>()(
  devtools(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
    }),
    { name: 'GlobalStore' },
  ),
);

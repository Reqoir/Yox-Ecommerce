import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { settingsApi, StoreConfig, DEFAULT_STORE_CONFIG } from '@/api/admin/settings';

interface StoreSettingsState {
  config: StoreConfig;
  isLoading: boolean;
  isSaving: boolean;
  hasLoaded: boolean;
  lastFetchedAt: number | null;

  fetchSettings: (force?: boolean) => Promise<StoreConfig>;
  updateSettings: (partial: Partial<StoreConfig>) => Promise<StoreConfig>;
  resetToDefaults: () => Promise<StoreConfig>;

  // Computed / Helper selectors
  getShippingFee: (subtotal: number) => number;
  getRemainingForFreeShipping: (subtotal: number) => number;
  getFreeShippingPercentage: (subtotal: number) => number;
}

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_STORE_CONFIG,
      isLoading: false,
      isSaving: false,
      hasLoaded: false,
      lastFetchedAt: null,

      fetchSettings: async (force = false) => {
        const { lastFetchedAt, isLoading } = get();
        // If loaded within the last 60 seconds and not forced, return cached config
        if (!force && lastFetchedAt && Date.now() - lastFetchedAt < 60_000 && get().hasLoaded) {
          return get().config;
        }

        if (isLoading) return get().config;

        set({ isLoading: true });
        try {
          const fresh = await settingsApi.getStoreConfig();
          set({
            config: { ...DEFAULT_STORE_CONFIG, ...fresh },
            hasLoaded: true,
            lastFetchedAt: Date.now(),
          });
          return fresh;
        } catch (error) {
          console.warn('Failed to load store settings, using cached defaults:', error);
          return get().config;
        } finally {
          set({ isLoading: false });
        }
      },

      updateSettings: async (partial: Partial<StoreConfig>) => {
        set({ isSaving: true });
        try {
          const updated = await settingsApi.updateStoreConfig(partial);
          const merged = { ...DEFAULT_STORE_CONFIG, ...updated };
          set({
            config: merged,
            hasLoaded: true,
            lastFetchedAt: Date.now(),
          });
          return merged;
        } finally {
          set({ isSaving: false });
        }
      },

      resetToDefaults: async () => {
        set({ isSaving: true });
        try {
          const reset = await settingsApi.updateStoreConfig(DEFAULT_STORE_CONFIG);
          set({
            config: DEFAULT_STORE_CONFIG,
            hasLoaded: true,
            lastFetchedAt: Date.now(),
          });
          return DEFAULT_STORE_CONFIG;
        } finally {
          set({ isSaving: false });
        }
      },

      getShippingFee: (subtotal: number) => {
        const { freeShippingThreshold, standardShippingFee } = get().config;
        if (subtotal === 0 || subtotal >= freeShippingThreshold) {
          return 0;
        }
        return standardShippingFee;
      },

      getRemainingForFreeShipping: (subtotal: number) => {
        const { freeShippingThreshold } = get().config;
        return Math.max(0, freeShippingThreshold - subtotal);
      },

      getFreeShippingPercentage: (subtotal: number) => {
        const { freeShippingThreshold } = get().config;
        if (freeShippingThreshold <= 0) return 100;
        return Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
      },
    }),
    {
      name: 'yox_store_settings',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        config: state.config,
        lastFetchedAt: state.lastFetchedAt,
        hasLoaded: state.hasLoaded,
      }),
    }
  )
);

// Cross-tab and window-level reactive synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'yox_store_settings' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.state?.config) {
          useStoreSettingsStore.setState({
            config: { ...DEFAULT_STORE_CONFIG, ...parsed.state.config },
            hasLoaded: true,
          });
        }
      } catch (err) {}
    }
  });
}


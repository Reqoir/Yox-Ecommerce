import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistsApi } from '@/lib/api/wishlists';
import { useAuthStore } from './useAuthStore';

export interface FavouriteItem {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  comparePrice?: number;
  tag?: string;
  inStock: boolean;
}

interface FavouritesState {
  items: FavouriteItem[];
  fetchWishlist: () => Promise<void>;
  addFavourite: (item: FavouriteItem) => void;
  removeFavourite: (id: string) => void;
  toggleFavourite: (item: FavouriteItem) => void;
  isFavourite: (id: string) => boolean;
  clearFavourites: () => void;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      items: [],

      fetchWishlist: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;
          const data = await wishlistsApi.getWishlist();
          if (data?.data?.items) {
            const apiItems = data.data.items.map((i: any) => ({
              id: i.productId,
              name: i.productName,
              category: 'Category', // Placeholder since API doesn't populate category
              image: i.productImage,
              price: i.productPrice,
              inStock: i.productStock > 0,
            }));
            set({ items: apiItems });
          }
        } catch (error) {
          console.error('Failed to fetch wishlist:', error);
        }
      },

      addFavourite: async (item) => {
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        });
        
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            await wishlistsApi.toggleWishlist(item.id);
          }
        } catch (error) {
          console.error('Failed to sync wishlist add:', error);
        }
      },

      removeFavourite: async (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            await wishlistsApi.toggleWishlist(id);
          }
        } catch (error) {
          console.error('Failed to sync wishlist remove:', error);
        }
      },

      toggleFavourite: (item) => {
        const exists = get().isFavourite(item.id);
        if (exists) {
          get().removeFavourite(item.id);
        } else {
          get().addFavourite(item);
        }
      },

      isFavourite: (id) => {
        return get().items.some((item) => item.id === id);
      },

      clearFavourites: () => set({ items: [] }),
    }),
    {
      name: 'yox-favourites-storage',
    }
  )
);

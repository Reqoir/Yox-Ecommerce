import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistsApi, WishlistProductItem } from '@/lib/api/wishlists';
import { useAuthStore } from './useAuthStore';

export interface FavouriteItem {
  id: string; // Unique composite key e.g. `${productId}__${color}` or productId
  productId?: string;
  color?: string | null;
  name: string;
  slug?: string;
  category: string;
  image: string;
  price: number;
  comparePrice?: number | null;
  tag?: string | null;
  fit?: string | null;
  inStock: boolean;
}

interface FavouritesState {
  items: FavouriteItem[];
  isLoading: boolean;
  isInitialized: boolean;
  fetchWishlist: () => Promise<void>;
  addFavourite: (item: FavouriteItem) => Promise<void>;
  removeFavourite: (productId: string, color?: string | null) => Promise<void>;
  toggleFavourite: (item: FavouriteItem) => Promise<void>;
  isFavourite: (productId: string, color?: string | null) => boolean;
  clearFavourites: () => Promise<void>;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isInitialized: false,

      fetchWishlist: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) {
            set({ isLoading: false, isInitialized: true });
            return;
          }

          set({ isLoading: true });
          const res = await wishlistsApi.getWishlist();
          if (res?.success && res.data?.items) {
            const apiItems: FavouriteItem[] = res.data.items.map((i: WishlistProductItem) => {
              const pId = i.productId;
              const itemColor = i.color ? i.color.trim() : null;
              const compositeId = itemColor ? `${pId}__${itemColor}` : pId;

              return {
                id: compositeId,
                productId: pId,
                color: itemColor,
                name: i.productName || 'Product',
                slug: i.productSlug,
                category: i.productCategory || 'Apparel',
                image: i.productImage || '/images/product-1.jpeg',
                price: Number(i.productPrice) || 0,
                comparePrice: i.productComparePrice ? Number(i.productComparePrice) : null,
                tag: i.productTag || null,
                fit: i.productFit || null,
                inStock: i.inStock !== false && (i.productStock === undefined || i.productStock > 0),
              };
            });
            set({ items: apiItems, isLoading: false, isInitialized: true });
          } else {
            set({ isLoading: false, isInitialized: true });
          }
        } catch (error) {
          console.error('Failed to fetch user wishlist from backend:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      addFavourite: async (item: FavouriteItem) => {
        const previousItems = get().items;
        const prodId = item.productId || item.id || '';
        const targetId = item.id || (item.color ? `${prodId}__${item.color}` : prodId);
        const normalizedItem: FavouriteItem = { ...item, id: targetId, productId: prodId };

        if (previousItems.some((i) => i.id === normalizedItem.id)) return;

        // Optimistic UI update
        set({ items: [normalizedItem, ...previousItems] });

        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated && prodId) {
            await wishlistsApi.toggleWishlist(prodId, normalizedItem.color);
          }
        } catch (error) {
          console.error('Failed to sync wishlist add with backend:', error);
        }
      },

      removeFavourite: async (productId: string, color?: string | null) => {
        const previousItems = get().items;
        const targetColor = color ? color.trim().toLowerCase() : null;

        const updatedItems = previousItems.filter((item) => {
          const isSameProduct = (item.productId === productId || item.id === productId || item.id.startsWith(`${productId}__`));
          if (!isSameProduct) return true;
          
          if (targetColor) {
            const itemColor = item.color ? item.color.trim().toLowerCase() : null;
            return itemColor !== targetColor;
          }
          return false;
        });

        set({ items: updatedItems });

        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            await wishlistsApi.toggleWishlist(productId, color);
          }
        } catch (error) {
          console.error('Failed to sync wishlist remove with backend:', error);
        }
      },

      toggleFavourite: async (item: FavouriteItem) => {
        const exists = get().isFavourite(item.productId || item.id, item.color);
        if (exists) {
          await get().removeFavourite(item.productId || item.id, item.color);
        } else {
          await get().addFavourite(item);
        }
      },

      isFavourite: (productId: string, color?: string | null) => {
        const targetColor = color ? color.trim().toLowerCase() : null;
        return get().items.some((item) => {
          const isSameProduct = (item.productId === productId || item.id === productId || item.id.startsWith(`${productId}__`));
          if (!isSameProduct) return false;
          
          if (targetColor) {
            const itemColor = item.color ? item.color.trim().toLowerCase() : null;
            return itemColor === targetColor;
          }
          return true;
        });
      },

      clearFavourites: async () => {
        set({ items: [] });
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            await wishlistsApi.clearWishlist();
          }
        } catch (error) {
          console.error('Failed to clear wishlist on backend:', error);
        }
      },
    }),
    {
      name: 'yox-favourites-storage',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addFavourite: (item: FavouriteItem) => void;
  removeFavourite: (id: string) => void;
  toggleFavourite: (item: FavouriteItem) => void;
  isFavourite: (id: string) => boolean;
  clearFavourites: () => void;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      items: [
        {
          id: '1',
          name: 'Classic Linen Blend Shirt',
          category: 'Shirts',
          image: '/images/product-4.jpeg',
          price: 1799,
          comparePrice: 2499,
          tag: 'BESTSELLER',
          inStock: true,
        },
        {
          id: '3',
          name: 'Relaxed Fit Cargo Trousers',
          category: 'Pants',
          image: '/images/product-3.jpeg',
          price: 2199,
          comparePrice: 2999,
          tag: 'NEW',
          inStock: true,
        },
        {
          id: '6',
          name: 'Vintage Wash Graphic Tee',
          category: 'T-Shirts',
          image: '/images/product-6.jpeg',
          price: 899,
          comparePrice: 1299,
          inStock: true,
        },
      ],

      addFavourite: (item) => {
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        });
      },

      removeFavourite: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // Unique combination of productId-color-size
  productId: string;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  comparePrice?: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getSavingsTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [
        // Seed default item for demonstration preview
        {
          id: '1-navy-L',
          productId: '1',
          name: 'Classic Linen Blend Shirt - Navy',
          image: '/images/product-4.jpeg',
          color: 'Navy Blue',
          size: 'L',
          price: 1799,
          comparePrice: 2499,
          quantity: 1,
        },
        {
          id: '2-black-M',
          productId: '2',
          name: 'Oversized Heavyweight Cotton Tee',
          image: '/images/product-1.jpeg',
          color: 'Charcoal Black',
          size: 'M',
          price: 999,
          comparePrice: 1499,
          quantity: 2,
        },
      ],

      addItem: (newItem) => {
        const id = `${newItem.productId}-${newItem.color}-${newItem.size}`;
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id);
          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += newItem.quantity || 1;
            return { items: updatedItems };
          }
          return { items: [...state.items, { ...newItem, id, quantity: newItem.quantity || 1 }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, delta) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[],
        }));
      },

      setQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getSavingsTotal: () => {
        return get().items.reduce((sum, item) => {
          if (item.comparePrice && item.comparePrice > item.price) {
            return sum + (item.comparePrice - item.price) * item.quantity;
          }
          return sum;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'yox-cart-storage',
    }
  )
);

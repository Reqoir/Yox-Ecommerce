import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAuthStore } from './useAuthStore';
import { cartApi } from '../lib/api/cart';

export interface CartItem {
  id: string; // Unique variant ID or combination
  variantId?: string;
  productId: string;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'> & { id?: string; variantId?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  getSubtotal: () => number;
  getSavingsTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const variantId = newItem.variantId || newItem.id || `${newItem.productId}-${newItem.color}-${newItem.size}`;
        const id = variantId;
        const maxStock = newItem.stock !== undefined ? newItem.stock : 99;

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id || i.variantId === variantId);
          const addedQty = newItem.quantity || 1;

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = Math.min(maxStock, currentItem.quantity + addedQty);
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              price: newItem.price || currentItem.price,
              comparePrice: newItem.comparePrice !== undefined ? newItem.comparePrice : currentItem.comparePrice,
              stock: maxStock,
            };
            return { items: updatedItems };
          }
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                id,
                variantId,
                quantity: Math.min(maxStock, addedQty),
                stock: maxStock,
              },
            ],
          };
        });

        // Sync with server asynchronously if logged in
        setTimeout(async () => {
          try {
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated && variantId && !variantId.includes('-')) {
              await cartApi.addItem(variantId, newItem.quantity || 1);
            }
          } catch (err) {
            console.error('Error adding item to server cart:', err);
          }
        }, 0);
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id || i.variantId === id);
        set((state) => ({
          items: state.items.filter((i) => i.id !== id && i.variantId !== id),
        }));

        setTimeout(async () => {
          try {
            const { isAuthenticated } = useAuthStore.getState();
            const variantId = item?.variantId || id;
            if (isAuthenticated && variantId && !variantId.includes('-')) {
              await cartApi.removeItem(variantId);
            }
          } catch (err) {
            console.error('Error removing cart item from server:', err);
          }
        }, 0);
      },

      updateQuantity: (id, delta) => {
        const item = get().items.find((i) => i.id === id || i.variantId === id);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          get().removeItem(id);
          return;
        }

        if (item.stock !== undefined && newQty > item.stock) {
          return; // Prevent exceeding stock limit
        }

        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.id === id || i.variantId === id) {
                return { ...i, quantity: newQty };
              }
              return i;
            })
            .filter(Boolean) as CartItem[],
        }));

        setTimeout(async () => {
          try {
            const { isAuthenticated } = useAuthStore.getState();
            const variantId = item.variantId || id;
            if (isAuthenticated && variantId && !variantId.includes('-')) {
              await cartApi.updateItem(variantId, newQty);
            }
          } catch (err) {
            console.error('Error updating cart quantity on server:', err);
          }
        }, 0);
      },

      setQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const item = get().items.find((i) => i.id === id || i.variantId === id);
        if (!item) return;

        const actualQty = item.stock !== undefined ? Math.min(item.stock, quantity) : quantity;

        set((state) => ({
          items: state.items.map((i) => (i.id === id || i.variantId === id ? { ...i, quantity: actualQty } : i)),
        }));

        setTimeout(async () => {
          try {
            const { isAuthenticated } = useAuthStore.getState();
            const variantId = item.variantId || id;
            if (isAuthenticated && variantId && !variantId.includes('-')) {
              await cartApi.updateItem(variantId, actualQty);
            }
          } catch (err) {
            console.error('Error setting cart quantity on server:', err);
          }
        }, 0);
      },

      clearCart: () => {
        set({ items: [] });
        setTimeout(async () => {
          try {
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              await cartApi.clearCart();
            }
          } catch (err) {
            console.error('Error clearing server cart:', err);
          }
        }, 0);
      },

      syncWithServer: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;

          const currentLocalItems = get().items;
          const serverCart = await cartApi.getCart();

          // Merge local offline items to server if not present
          if (currentLocalItems.length > 0 && serverCart) {
            for (const localItem of currentLocalItems) {
              const variantId = localItem.variantId || localItem.id;
              const existsOnServer = serverCart.items?.some((si) => si.variantId === variantId);
              if (!existsOnServer && variantId && !variantId.includes('-')) {
                try {
                  await cartApi.addItem(variantId, localItem.quantity);
                } catch (e) {
                  // Ignore failed items (e.g., outdated IDs or out of stock)
                }
              }
            }
          }

          // Refetch authoritative server cart
          const updatedServerCart = await cartApi.getCart();
          if (updatedServerCart && updatedServerCart.items) {
            const mappedItems: CartItem[] = updatedServerCart.items.map((si) => ({
              id: si.variantId,
              variantId: si.variantId,
              productId: si.productId || si.variantId,
              name: si.name || `Product Variant`,
              image: si.image || '/images/product-1.jpeg',
              color: si.color || 'Default',
              size: si.size || 'Standard',
              price: si.price,
              comparePrice: si.comparePrice || undefined,
              quantity: si.quantity,
              stock: si.stock !== undefined ? si.stock : 99,
            }));
            set({ items: mappedItems });
          }
        } catch (err) {
          console.error('Failed to sync cart with server:', err);
        }
      },

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

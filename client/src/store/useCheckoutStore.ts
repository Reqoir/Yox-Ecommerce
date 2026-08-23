import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addressesApi, Address as ApiAddress } from '../lib/api/addresses';
import { useAuthStore } from './useAuthStore';

export type Address = ApiAddress;

export type PaymentMethod = 'COD' | 'RAZORPAY';

interface OrderDetails {
  orderId: string;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryDate: string;
  itemCount: number;
}

interface CheckoutState {
  addresses: Address[];
  selectedAddressId: string | null;
  paymentMethod: PaymentMethod;
  isAddAddressOpen: boolean;
  isOrderSuccess: boolean;
  lastOrderDetails: OrderDetails | null;
  isLoadingAddresses: boolean;
  
  // Actions
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setIsAddAddressOpen: (open: boolean) => void;
  setOrderSuccess: (success: boolean, details?: OrderDetails) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      paymentMethod: 'RAZORPAY',
      isAddAddressOpen: false,
      isOrderSuccess: false,
      lastOrderDetails: null,
      isLoadingAddresses: false,

      fetchAddresses: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;

          set({ isLoadingAddresses: true });
          const fetchedAddresses = await addressesApi.getAddresses();
          
          set((state) => {
            // Keep selected address if it still exists, otherwise select the default or first one
            let newSelectedId = state.selectedAddressId;
            const stillExists = fetchedAddresses.find(a => a.id === newSelectedId);
            
            if (!stillExists && fetchedAddresses.length > 0) {
              const defaultAddr = fetchedAddresses.find(a => a.isDefault);
              newSelectedId = defaultAddr ? defaultAddr.id : fetchedAddresses[0].id;
            }

            return {
              addresses: fetchedAddresses,
              selectedAddressId: newSelectedId,
              isLoadingAddresses: false,
            };
          });
        } catch (error) {
          console.error('Failed to fetch addresses:', error);
          set({ isLoadingAddresses: false });
        }
      },

      addAddress: async (newAddr) => {
        try {
          const added = await addressesApi.addAddress(newAddr);
          set((state) => {
            const updated = [...state.addresses, added];
            return {
              addresses: updated,
              selectedAddressId: added.id, // auto-select new address
            };
          });
        } catch (error) {
          console.error('Failed to add address:', error);
          throw error;
        }
      },

      removeAddress: async (id) => {
        try {
          await addressesApi.deleteAddress(id);
          set((state) => {
            const updated = state.addresses.filter((a) => a.id !== id);
            return {
              addresses: updated,
              selectedAddressId: state.selectedAddressId === id ? (updated[0]?.id || null) : state.selectedAddressId,
            };
          });
        } catch (error) {
          console.error('Failed to remove address:', error);
          throw error;
        }
      },

      selectAddress: (id) => set({ selectedAddressId: id }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setIsAddAddressOpen: (open) => set({ isAddAddressOpen: open }),

      setOrderSuccess: (success, details) => set({ isOrderSuccess: success, lastOrderDetails: details || null }),

      resetCheckout: () => set({ isOrderSuccess: false, lastOrderDetails: null, addresses: [], selectedAddressId: null }),
    }),
    {
      name: 'yox-checkout-storage',
      // We don't want to persist addresses as they should be fetched fresh,
      // but we do want to persist paymentMethod and selectedAddressId.
      partialize: (state) => ({
        paymentMethod: state.paymentMethod,
        selectedAddressId: state.selectedAddressId,
      }),
    }
  )
);

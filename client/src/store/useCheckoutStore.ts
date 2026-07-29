import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK';
  isDefault?: boolean;
}

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
  
  // Actions
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setIsAddAddressOpen: (open: boolean) => void;
  setOrderSuccess: (success: boolean, details?: OrderDetails) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      addresses: [
        {
          id: 'addr-1',
          fullName: 'John Doe',
          phone: '+91 98765 43210',
          pincode: '400001',
          streetAddress: 'Flat 402, Sunshine Heights, MG Road',
          landmark: 'Near Central Bank',
          city: 'Mumbai',
          state: 'Maharashtra',
          type: 'HOME',
          isDefault: true,
        },
        {
          id: 'addr-2',
          fullName: 'John Doe (Office)',
          phone: '+91 98765 43210',
          pincode: '400051',
          streetAddress: 'Level 8, Tech Park Towers, BKC',
          city: 'Mumbai',
          state: 'Maharashtra',
          type: 'WORK',
          isDefault: false,
        },
      ],
      selectedAddressId: 'addr-1',
      paymentMethod: 'RAZORPAY',
      isAddAddressOpen: false,
      isOrderSuccess: false,
      lastOrderDetails: null,

      addAddress: (newAddr) => {
        const id = `addr-${Date.now()}`;
        set((state) => {
          const updated = [...state.addresses, { ...newAddr, id }];
          return {
            addresses: updated,
            selectedAddressId: id, // auto-select new address
          };
        });
      },

      removeAddress: (id) => {
        set((state) => {
          const updated = state.addresses.filter((a) => a.id !== id);
          return {
            addresses: updated,
            selectedAddressId: state.selectedAddressId === id ? (updated[0]?.id || null) : state.selectedAddressId,
          };
        });
      },

      selectAddress: (id) => set({ selectedAddressId: id }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setIsAddAddressOpen: (open) => set({ isAddAddressOpen: open }),

      setOrderSuccess: (success, details) => set({ isOrderSuccess: success, lastOrderDetails: details || null }),

      resetCheckout: () => set({ isOrderSuccess: false, lastOrderDetails: null }),
    }),
    {
      name: 'yox-checkout-storage',
    }
  )
);

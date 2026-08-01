import apiClient from '../axios';

export interface BackendCartItem {
  variantId: string;
  productId?: string;
  name?: string;
  slug?: string;
  image?: string;
  color?: string;
  size?: string;
  stock?: number;
  price: number;
  comparePrice?: number | null;
  quantity: number;
  subtotal: number;
}

export interface BackendCartResponse {
  id: string;
  userId: string;
  items: BackendCartItem[];
  totalItems: number;
  totalAmount: number;
  couponId?: string | null;
  discountAmount?: number | null;
  finalAmount: number;
}

export interface BackendCheckoutSummary {
  cartId: string;
  items: BackendCartItem[];
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}

export const cartApi = {
  getCart: async (): Promise<BackendCartResponse> => {
    const response = await apiClient.get<{ data: BackendCartResponse }>('/cart');
    return response.data?.data;
  },

  addItem: async (variantId: string, quantity: number = 1): Promise<BackendCartResponse> => {
    const response = await apiClient.post<{ data: BackendCartResponse }>('/cart/items', { variantId, quantity });
    return response.data?.data;
  },

  updateItem: async (variantId: string, quantity: number): Promise<BackendCartResponse> => {
    const response = await apiClient.patch<{ data: BackendCartResponse }>(`/cart/items/${variantId}`, { quantity });
    return response.data?.data;
  },

  removeItem: async (variantId: string): Promise<BackendCartResponse> => {
    const response = await apiClient.delete<{ data: BackendCartResponse }>(`/cart/items/${variantId}`);
    return response.data?.data;
  },

  clearCart: async (): Promise<BackendCartResponse> => {
    const response = await apiClient.delete<{ data: BackendCartResponse }>('/cart');
    return response.data?.data;
  },

  getCheckoutSummary: async (): Promise<BackendCheckoutSummary> => {
    const response = await apiClient.get<{ data: BackendCheckoutSummary }>('/checkout/summary');
    return response.data?.data;
  },
};

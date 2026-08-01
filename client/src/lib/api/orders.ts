import apiClient from '../axios';

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface BackendOrder {
  id: string;
  orderNumber: string;
  userId: string;
  couponId?: string | null;
  paymentId?: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  items: OrderItemSnapshot[];
  placedAt: string;
  confirmedAt?: string | null;
  packedAt?: string | null;
  shippedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  trackingNumber?: string | null;
  deliveryPartnerId?: string | null;
}

export interface PlaceOrderPayload {
  shippingAddress: ShippingAddressSnapshot;
  paymentMethod: string;
  paymentId?: string;
  couponId?: string;
  notes?: string;
}

export interface PaginatedOrdersResponse {
  orders?: BackendOrder[];
  data?: BackendOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ordersApi = {
  placeOrder: async (payload: PlaceOrderPayload): Promise<BackendOrder> => {
    const response = await apiClient.post<{ data: BackendOrder }>('/orders', payload);
    return response.data?.data || (response.data as unknown as BackendOrder);
  },

  getMyOrders: async (page: number = 1, limit: number = 20): Promise<{ orders: BackendOrder[]; total: number; totalPages: number }> => {
    const response = await apiClient.get<{ data: any }>(`/orders?page=${page}&limit=${limit}`);
    const resData = response.data?.data;
    return {
      orders: resData?.orders || resData?.data || (Array.isArray(resData) ? resData : []),
      total: resData?.total || 0,
      totalPages: resData?.totalPages || 1,
    };
  },

  getAllOrdersAdmin: async (page: number = 1, limit: number = 50, status?: string): Promise<{ orders: BackendOrder[]; total: number; totalPages: number }> => {
    const query = new URLSearchParams({ all: 'true', page: page.toString(), limit: limit.toString() });
    if (status && status !== 'all') query.append('status', status);
    const response = await apiClient.get<{ data: any }>(`/orders?${query.toString()}`);
    const resData = response.data?.data;
    return {
      orders: resData?.orders || resData?.data || (Array.isArray(resData) ? resData : []),
      total: resData?.total || 0,
      totalPages: resData?.totalPages || 1,
    };
  },

  getOrderById: async (idOrOrderNumber: string): Promise<BackendOrder> => {
    const response = await apiClient.get<{ data: BackendOrder }>(`/orders/${idOrOrderNumber}`);
    return response.data?.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/cancel`, { reason: reason || 'Cancelled by user' });
    return response.data?.data;
  },

  // Admin State Machine Operations
  confirmOrder: async (id: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/confirm`);
    return response.data?.data;
  },

  packOrder: async (id: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/pack`);
    return response.data?.data;
  },

  shipOrder: async (id: string, trackingNumber?: string, deliveryPartnerId?: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/ship`, { trackingNumber, deliveryPartnerId });
    return response.data?.data;
  },

  outForDelivery: async (id: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/out-for-delivery`);
    return response.data?.data;
  },

  deliverOrder: async (id: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/deliver`);
    return response.data?.data;
  },

  updateStatusAdmin: async (id: string, status: OrderStatus, notes?: string): Promise<BackendOrder> => {
    const response = await apiClient.patch<{ data: BackendOrder }>(`/orders/${id}/status`, { status, notes });
    return response.data?.data;
  },
};

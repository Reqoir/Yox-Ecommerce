import apiClient from '../axios';
import { BackendOrder, ShippingAddressSnapshot } from './orders';

export interface CreateRazorpayOrderRequest {
  shippingAddress: ShippingAddressSnapshot;
  addressId?: string;
  notes?: string;
  couponId?: string;
  directBuyItem?: {
    variantId: string;
    quantity: number;
    price?: number;
  };
}

export interface CreateRazorpayOrderResponse {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export interface VerifyRazorpayPaymentRequest {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const paymentsApi = {
  /**
   * Request backend to calculate authoritative total and initialize a Razorpay order
   */
  createRazorpayOrder: async (payload: CreateRazorpayOrderRequest): Promise<CreateRazorpayOrderResponse> => {
    const response = await apiClient.post<{ data: CreateRazorpayOrderResponse }>('/payments/create-order', payload);
    return response.data?.data || (response.data as unknown as CreateRazorpayOrderResponse);
  },

  /**
   * Cryptographically verify payment signature on backend and confirm order
   */
  verifyRazorpayPayment: async (payload: VerifyRazorpayPaymentRequest): Promise<BackendOrder> => {
    const response = await apiClient.post<{ data: BackendOrder }>('/payments/verify', payload);
    return response.data?.data || (response.data as unknown as BackendOrder);
  },
};

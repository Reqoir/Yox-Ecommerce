import apiClient from '../axios';

export type ReturnReason =
  | 'WRONG_SIZE'
  | 'WRONG_PRODUCT'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'NOT_AS_EXPECTED'
  | 'CHANGED_MIND'
  | 'OTHER';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type InspectionResult = 'RESELLABLE' | 'DAMAGED';

export interface BackendReturn {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  quantity: number;
  reason: ReturnReason | string;
  customerNote?: string | null;
  status: ReturnStatus | string;
  inspectionResult?: InspectionResult | string | null;
  rejectionReason?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  approvedAt?: string | null;
  receivedAt?: string | null;
  inspectedAt?: string | null;
  refundedAt?: string | null;
  pickupDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRefund {
  id: string;
  paymentId?: string | null;
  orderId: string;
  returnId: string;
  amount: number;
  paymentMethod: string;
  gatewayRefundId?: string | null;
  status: string;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPayload {
  orderId: string;
  orderItemId: string;
  quantity: number;
  reason: ReturnReason | string;
  customerNote?: string;
}

export const returnsApi = {
  createReturn: async (payload: CreateReturnPayload): Promise<BackendReturn> => {
    const response = await apiClient.post<{ data: BackendReturn }>('/returns', payload);
    return response.data?.data;
  },

  getMyReturns: async (): Promise<BackendReturn[]> => {
    const response = await apiClient.get<{ data: BackendReturn[] }>('/returns');
    return response.data?.data || [];
  },

  getReturnById: async (id: string): Promise<BackendReturn> => {
    const response = await apiClient.get<{ data: BackendReturn }>(`/returns/${id}`);
    return response.data?.data;
  },

  // Admin / Staff Return Operations
  getAllReturnsAdmin: async (page = 1, limit = 50): Promise<{ data: BackendReturn[]; total: number }> => {
    const response = await apiClient.get<{ data: { data: BackendReturn[]; total: number } }>(`/returns/admin/all?page=${page}&limit=${limit}`);
    return response.data?.data || { data: [], total: 0 };
  },

  approveReturn: async (id: string): Promise<BackendReturn> => {
    const response = await apiClient.patch<{ data: BackendReturn }>(`/returns/${id}/approve`);
    return response.data?.data;
  },

  rejectReturn: async (id: string, reason: string): Promise<BackendReturn> => {
    const response = await apiClient.patch<{ data: BackendReturn }>(`/returns/${id}/reject`, { reason });
    return response.data?.data;
  },

  schedulePickup: async (id: string, pickupDate?: string): Promise<BackendReturn> => {
    const response = await apiClient.patch<{ data: BackendReturn }>(`/returns/${id}/pickup`, { pickupDate });
    return response.data?.data;
  },

  receiveReturn: async (id: string): Promise<BackendReturn> => {
    const response = await apiClient.patch<{ data: BackendReturn }>(`/returns/${id}/receive`);
    return response.data?.data;
  },

  inspectReturn: async (id: string, inspectionResult: InspectionResult): Promise<BackendReturn> => {
    const response = await apiClient.patch<{ data: BackendReturn }>(`/returns/${id}/inspect`, { inspectionResult });
    return response.data?.data;
  },

  processRefund: async (returnId: string): Promise<BackendRefund> => {
    const response = await apiClient.post<{ data: BackendRefund }>('/payments/refund', { returnId });
    return response.data?.data;
  },
};

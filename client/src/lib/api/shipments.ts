import apiClient from '../axios';

export type ShipmentStatus =
  | 'PENDING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNED_TO_SELLER';

export interface BackendShipment {
  id: string;
  orderId: string;
  deliveryPartnerId?: string | null;
  trackingNumber?: string | null;
  status: ShipmentStatus | string;
  estimatedDeliveryDate?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const shipmentsApi = {
  getShipmentByOrder: async (orderId: string): Promise<BackendShipment> => {
    const response = await apiClient.get<{ data: BackendShipment }>(`/shipments/order/${orderId}`);
    return response.data?.data;
  },

  trackShipment: async (trackingNumber: string): Promise<BackendShipment> => {
    const response = await apiClient.get<{ data: BackendShipment }>(`/shipments/track/${trackingNumber}`);
    return response.data?.data;
  },

  updateShipmentStatus: async (id: string, status: string, notes?: string): Promise<BackendShipment> => {
    const response = await apiClient.patch<{ data: BackendShipment }>(`/shipments/${id}/status`, { status, notes });
    return response.data?.data;
  },

  getAllShipments: async (page = 1, limit = 50): Promise<{ data: BackendShipment[]; total: number }> => {
    const response = await apiClient.get<{ data: { data: BackendShipment[]; total: number } }>(`/shipments?page=${page}&limit=${limit}`);
    return response.data?.data || { data: [], total: 0 };
  },
};

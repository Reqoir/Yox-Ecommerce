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

export interface ShipmentScanActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
}

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
  shiprocketOrderId?: number | string | null;
  shiprocketShipmentId?: number | string | null;
  awbCode?: string | null;
  courierName?: string | null;
  pickupTokenNumber?: string | null;
  pickupScheduledDate?: string | null;
  labelUrl?: string | null;
  invoiceUrl?: string | null;
  trackingActivities?: ShipmentScanActivity[];
  createdAt: string;
  updatedAt: string;
}

export const shipmentsApi = {
  getShipmentByOrder: async (orderId: string): Promise<BackendShipment | null> => {
    const response = await apiClient.get<{ data: BackendShipment | null }>(`/shipments/order/${orderId}`);
    return response.data?.data ?? null;
  },

  trackShipment: async (trackingNumber: string): Promise<BackendShipment> => {
    const response = await apiClient.get<{ data: BackendShipment }>(`/shipments/track/${trackingNumber}`);
    return response.data?.data;
  },

  syncCourierStatus: async (orderId: string): Promise<BackendShipment> => {
    const response = await apiClient.post<{ data: BackendShipment }>(`/shipments/${orderId}/sync-courier`);
    return response.data?.data;
  },

  getLabelUrl: async (orderId: string): Promise<{ labelUrl: string | null }> => {
    const response = await apiClient.post<{ data: { labelUrl: string | null } }>(`/shipments/${orderId}/label`);
    return response.data?.data || { labelUrl: null };
  },

  getInvoiceUrl: async (orderId: string): Promise<{ invoiceUrl: string | null }> => {
    const response = await apiClient.post<{ data: { invoiceUrl: string | null } }>(`/shipments/${orderId}/invoice`);
    return response.data?.data || { invoiceUrl: null };
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

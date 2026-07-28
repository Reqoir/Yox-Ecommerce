import apiClient from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  warehouseLocation: string | null;
  lowStockThreshold: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';
  amount: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInventoryDTO {
  availableStock?: number;
  reservedStock?: number;
  damagedStock?: number;
  warehouseLocation?: string | null;
  lowStockThreshold?: number;
}

export interface AdjustStockDTO {
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  reason?: string;
  reference?: string;
}

export interface ReserveStockDTO {
  quantity: number;
  reference?: string;
}

export interface ReleaseStockDTO {
  quantity: number;
  action: 'CANCEL' | 'FULFILL';
  reference?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────────

export const inventoryApi = {
  getAll: async (params?: { page?: number; limit?: number; warehouseLocation?: string }) => {
    const response = await apiClient.get<{ data: { data: InventoryItem[]; total: number } }>(
      '/inventory',
      { params }
    );
    return response.data.data;
  },

  getLowStock: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get<{ data: { data: InventoryItem[]; total: number } }>(
      '/inventory/low-stock',
      { params }
    );
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: InventoryItem }>(`/inventory/${id}`);
    return response.data.data;
  },

  getByVariantId: async (variantId: string) => {
    // Fetch all and find by variantId (public endpoint)
    const response = await apiClient.get<{ data: { data: InventoryItem[] } }>('/inventory', {
      params: { limit: 1000 },
    });
    return response.data.data.data.find((i) => i.variantId === variantId) ?? null;
  },

  update: async (id: string, data: UpdateInventoryDTO) => {
    const response = await apiClient.patch<{ data: InventoryItem }>(`/inventory/${id}`, data);
    return response.data.data;
  },

  adjustStock: async (id: string, data: AdjustStockDTO) => {
    const response = await apiClient.post<{ data: { inventory: InventoryItem; log: StockLog } }>(
      `/inventory/${id}/adjust`,
      data
    );
    return response.data.data;
  },

  reserve: async (id: string, data: ReserveStockDTO) => {
    const response = await apiClient.post<{ data: { inventory: InventoryItem; log: StockLog } }>(
      `/inventory/${id}/reserve`,
      data
    );
    return response.data.data;
  },

  release: async (id: string, data: ReleaseStockDTO) => {
    const response = await apiClient.post<{ data: { inventory: InventoryItem; log: StockLog } }>(
      `/inventory/${id}/release`,
      data
    );
    return response.data.data;
  },

  getLogs: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get<{ data: { data: StockLog[]; total: number } }>(
      `/inventory/${id}/logs`,
      { params }
    );
    return response.data.data;
  },
};

/**
 * @file inventory.dto.ts
 * @layer Application › DTOs
 */

export interface UpdateInventoryRequestDTO {
  availableStock?: number;
  reservedStock?: number;
  damagedStock?: number;
  warehouseLocation?: string | null;
}

export interface AdjustStockRequestDTO {
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  reason?: string;
  reference?: string;
}

export interface InventoryResponseDTO {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  warehouseLocation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLogResponseDTO {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @file inventory.dto.ts
 * @layer Application › DTOs
 */

export interface UpdateInventoryRequestDTO {
  availableStock?: number;
  reservedStock?: number;
  damagedStock?: number;
  warehouseLocation?: string | null;
  lowStockThreshold?: number;
}

export interface AdjustStockRequestDTO {
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  reason?: string;
  reference?: string;
}

/** Reserve qty units from availableStock → reservedStock (for pending orders) */
export interface ReserveStockRequestDTO {
  quantity: number;
  /** Order ID or reference so the log is traceable */
  reference?: string;
}

/** Release reserved stock — either back to available (cancel) or write-off (fulfilled) */
export interface ReleaseStockRequestDTO {
  quantity: number;
  /** 'CANCEL' returns reserved stock to availableStock; 'FULFILL' removes it permanently */
  action: 'CANCEL' | 'FULFILL';
  reference?: string;
}

export interface InventoryResponseDTO {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  warehouseLocation?: string | null;
  lowStockThreshold: number;
  isLowStock: boolean;
  productName?: string | null;
  productImage?: string | null;
  sku?: string | null;
  variantTitle?: string | null;
  color?: string | null;
  size?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLogResponseDTO {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';
  amount: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

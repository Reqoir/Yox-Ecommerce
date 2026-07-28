/**
 * @file inventory.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IInventoryDocument extends Document {
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  warehouseLocation?: string | null;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventoryDocument>(
  {
    variantId: { type: String, required: true, unique: true, index: true },
    availableStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    damagedStock: { type: Number, default: 0 },
    warehouseLocation: { type: String, default: null },
    /** Alert fires when availableStock <= lowStockThreshold */
    lowStockThreshold: { type: Number, default: 10 },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'inventories',
  }
);

inventorySchema.index({ createdAt: -1 });
// Compound index to quickly query low-stock items
inventorySchema.index({ availableStock: 1, lowStockThreshold: 1 });

export const InventoryModel = model<IInventoryDocument>('Inventory', inventorySchema);


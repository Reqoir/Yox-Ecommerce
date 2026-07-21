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
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'inventories',
  }
);

inventorySchema.index({ createdAt: -1 });

export const InventoryModel = model<IInventoryDocument>('Inventory', inventorySchema);

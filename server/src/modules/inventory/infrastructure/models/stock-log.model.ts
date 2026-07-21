/**
 * @file stock-log.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IStockLogDocument extends Document {
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

const stockLogSchema = new Schema<IStockLogDocument>(
  {
    inventoryId: { type: String, required: true, index: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT'], required: true },
    amount: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: null },
    reference: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'stock_logs',
  }
);

stockLogSchema.index({ createdAt: -1 });

export const StockLogModel = model<IStockLogDocument>('StockLog', stockLogSchema);

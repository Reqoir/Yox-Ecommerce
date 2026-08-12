/**
 * @file return.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IReturnDocument extends Document {
  orderId: string;
  orderItemId: string;
  userId: string;
  quantity: number;
  reason: string;
  customerNote?: string | null;
  status: string;
  inspectionResult?: string | null;
  rejectionReason?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  approvedAt?: Date | null;
  receivedAt?: Date | null;
  inspectedAt?: Date | null;
  refundedAt?: Date | null;
  pickupDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const returnSchema = new Schema<IReturnDocument>(
  {
    orderId: { type: String, required: true, index: true },
    orderItemId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    customerNote: { type: String, default: null },
    status: { type: String, required: true, default: 'REQUESTED', index: true },
    inspectionResult: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    refundId: { type: String, default: null },
    refundAmount: { type: Number, default: null },
    approvedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    inspectedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    pickupDate: { type: Date, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'returns',
  }
);

returnSchema.index({ createdAt: -1 });
returnSchema.index({ userId: 1, createdAt: -1 });

export const ReturnModel = model<IReturnDocument>('Return', returnSchema);

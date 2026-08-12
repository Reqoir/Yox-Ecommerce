/**
 * @file payment.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IPaymentDocument extends Document {
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string | null;
  gatewayOrderId?: string | null;
  refundedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefundDocument extends Document {
  paymentId?: string | null;
  orderId: string;
  returnId: string;
  amount: number;
  paymentMethod: string;
  gatewayRefundId?: string | null;
  status: string;
  failureReason?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true, default: 'PENDING', index: true },
    transactionId: { type: String, default: null },
    gatewayOrderId: { type: String, default: null },
    refundedAmount: { type: Number, default: 0, min: 0 },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'payments',
  }
);

const refundSchema = new Schema<IRefundDocument>(
  {
    paymentId: { type: String, default: null },
    orderId: { type: String, required: true, index: true },
    returnId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true },
    gatewayRefundId: { type: String, default: null },
    status: { type: String, required: true, default: 'PENDING', index: true },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'refunds',
  }
);

paymentSchema.index({ createdAt: -1 });
refundSchema.index({ createdAt: -1 });

export const PaymentModel = model<IPaymentDocument>('Payment', paymentSchema);
export const RefundModel = model<IRefundDocument>('Refund', refundSchema);

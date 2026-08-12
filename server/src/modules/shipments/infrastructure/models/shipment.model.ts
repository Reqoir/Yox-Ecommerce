/**
 * @file shipment.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IShipmentDocument extends Document {
  orderId: string;
  deliveryPartnerId?: string | null;
  trackingNumber?: string | null;
  status: string;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<IShipmentDocument>(
  {
    orderId: { type: String, required: true, index: true },
    deliveryPartnerId: { type: String, default: null },
    trackingNumber: { type: String, default: null, index: true },
    status: { type: String, required: true, default: 'PENDING', index: true },
    estimatedDeliveryDate: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'shipments',
  }
);

shipmentSchema.index({ createdAt: -1 });

export const ShipmentModel = model<IShipmentDocument>('Shipment', shipmentSchema);

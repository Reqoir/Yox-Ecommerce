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
  shiprocketOrderId?: number | string | null;
  shiprocketShipmentId?: number | string | null;
  awbCode?: string | null;
  courierName?: string | null;
  pickupTokenNumber?: string | null;
  pickupScheduledDate?: Date | null;
  labelUrl?: string | null;
  invoiceUrl?: string | null;
  trackingActivities?: Array<{
    date: string;
    status: string;
    activity: string;
    location: string;
  }>;
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
    shiprocketOrderId: { type: Schema.Types.Mixed, default: null },
    shiprocketShipmentId: { type: Schema.Types.Mixed, default: null },
    awbCode: { type: String, default: null, index: true },
    courierName: { type: String, default: null },
    pickupTokenNumber: { type: String, default: null },
    pickupScheduledDate: { type: Date, default: null },
    labelUrl: { type: String, default: null },
    invoiceUrl: { type: String, default: null },
    trackingActivities: {
      type: [
        {
          date: { type: String },
          status: { type: String },
          activity: { type: String },
          location: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'shipments',
  }
);

shipmentSchema.index({ createdAt: -1 });

export const ShipmentModel = model<IShipmentDocument>('Shipment', shipmentSchema);

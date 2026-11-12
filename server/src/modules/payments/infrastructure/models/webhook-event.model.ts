/**
 * @file webhook-event.model.ts
 * @layer Infrastructure › Models
 * @description Persists processed/in-flight webhook event IDs for replay/idempotency protection.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export type WebhookProvider = 'RAZORPAY' | 'SHIPROCKET';
export type WebhookProcessStatus = 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface IWebhookEventDocument extends Document {
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  orderId?: string | null;
  status: WebhookProcessStatus;
  errorMessage?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    provider: {
      type: String,
      enum: ['RAZORPAY', 'SHIPROCKET'],
      required: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
      required: true,
      default: 'PROCESSING',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'webhook_events',
  },
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.index({ createdAt: -1 });

export const WebhookEventModel = model<IWebhookEventDocument>('WebhookEvent', webhookEventSchema);


/**
 * @file notification.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface INotificationDocument extends Document {
  /** null = admin broadcast, string = specific user */
  userId: string | null;
  type: 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM' | 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const ALL_TYPES = ['LOW_STOCK', 'ORDER_STATUS', 'SYSTEM', 'NEW_ORDER', 'ORDER_CANCELLED', 'RETURN_REQUEST'] as const;

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, default: null, index: true },
    type: { type: String, enum: ALL_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'notifications',
  }
);

notificationSchema.index({ createdAt: -1 });
// Efficient query for user's unread count
notificationSchema.index({ userId: 1, isRead: 1 });

export const NotificationModel = model<INotificationDocument>('Notification', notificationSchema);

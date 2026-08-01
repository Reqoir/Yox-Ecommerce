/**
 * @file order.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';
import { OrderItemSnapshot, ShippingAddressSnapshot } from '../../domain/entities/order.entity';

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: string;
  couponId?: string | null;
  paymentId?: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  items: OrderItemSnapshot[];
  placedAt: Date;
  confirmedAt?: Date | null;
  packedAt?: Date | null;
  shippedAt?: Date | null;
  outForDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledReason?: string | null;
  trackingNumber?: string | null;
  deliveryPartnerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    size: { type: String, default: null },
    color: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    addressLine2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    postalCode: { type: String, required: true },
    landmark: { type: String, default: null },
    addressType: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    couponId: { type: String, default: null },
    paymentId: { type: String, default: null },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    shippingCharge: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true, index: true },
    orderStatus: { type: String, required: true, index: true },
    notes: { type: String, default: null },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    placedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date, default: null },
    packedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledReason: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    deliveryPartnerId: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'orders',
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = model<IOrderDocument>('Order', orderSchema);

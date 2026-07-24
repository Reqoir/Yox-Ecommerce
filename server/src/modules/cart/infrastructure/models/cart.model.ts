/**
 * @file cart.model.ts
 * @layer Infrastructure
 * 
 * Mongoose schema and model for Cart.
 */

import { Schema, model, Document } from 'mongoose';

export interface ICartItemDocument {
  variantId: Schema.Types.ObjectId | string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ICartDocument extends Document {
  userId: Schema.Types.ObjectId | string;
  items: ICartItemDocument[];
  totalItems: number;
  totalAmount: number;
  couponId?: Schema.Types.ObjectId | string | null;
  discountAmount?: number | null;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItemDocument>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
    totalItems: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountAmount: { type: Number, default: null },
    finalAmount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
CartSchema.index({ userId: 1 });

export const CartModel = model<ICartDocument>('Cart', CartSchema);

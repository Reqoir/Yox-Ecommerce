/**
 * @file product-variant.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the ProductVariant entity.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IProductVariantDocument extends Document {
  productId: string;
  sku: string;
  title: string;
  color: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  weight?: number | null;
  barcode?: string | null;
  images: string[];
  isDefault: boolean;
  isActive: boolean;
  size?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariantDocument>(
  {
    productId: { type: String, required: true, index: true }, // Ideally ObjectId if using populate, but String to match dbdiagram 'varchar'
    sku: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    comparePrice: { type: Number, default: null },
    costPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    weight: { type: Number, default: null },
    barcode: { type: String, default: null },
    images: { type: [String], default: [] },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    size: { type: String, default: null, trim: true },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'product_variants',
  }
);

productVariantSchema.index({ isActive: 1 });

export const ProductVariantModel = model<IProductVariantDocument>('ProductVariant', productVariantSchema);

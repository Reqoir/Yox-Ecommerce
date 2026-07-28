/**
 * @file product.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the Product entity.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IProductDocument extends Document {
  name: string;
  slug: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  fit?: string | null;
  tag?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  salesCount: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    categoryId: { type: String, default: null },
    subCategoryId: { type: String, default: null },
    brandId: { type: String, default: null },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    thumbnail: { type: String, default: null },
    fit: { type: String, default: null },
    tag: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
    salesCount: { type: Number, default: 0 },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'products',
  }
);

// Indexes for searching and sorting
productSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ subCategoryId: 1 });
productSchema.index({ brandId: 1 });
productSchema.index({ fit: 1 });
productSchema.index({ tag: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ createdAt: -1 });

export const ProductModel = model<IProductDocument>('Product', productSchema);

/**
 * @file category.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the Category entity.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, default: null },
    image: { type: String, default: null },
    icon: { type: String, default: null },
    parentCategoryId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'categories',
  }
);

// Indexes for searching and sorting
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ createdAt: -1 });

export const CategoryModel = model<ICategoryDocument>('Category', categorySchema);

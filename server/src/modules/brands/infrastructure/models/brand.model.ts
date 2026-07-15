/**
 * @file brand.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the Brand entity.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IBrandDocument extends Document {
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrandDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    logo: { type: String, default: null },
    description: { type: String, default: null },
    website: { type: String, default: null, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'brands',
  }
);

// Indexes for searching and sorting
brandSchema.index({ name: 'text', description: 'text' });
brandSchema.index({ isActive: 1 });
brandSchema.index({ displayOrder: 1 });
brandSchema.index({ createdAt: -1 });

export const BrandModel = model<IBrandDocument>('Brand', brandSchema);

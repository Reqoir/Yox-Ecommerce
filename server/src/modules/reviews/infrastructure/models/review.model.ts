/**
 * @file review.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IReviewDocument extends Document {
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: string; // 'APPROVED' or 'PENDING'
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: null },
    comment: { type: String, default: null },
    status: { type: String, required: true, default: 'APPROVED', index: true },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'reviews',
  }
);

reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ productId: 1, status: 1 });

export const ReviewModel = model<IReviewDocument>('Review', reviewSchema);

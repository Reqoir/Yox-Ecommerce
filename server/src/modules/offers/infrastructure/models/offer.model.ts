/**
 * @file offer.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the Offer entity.
 */

import { Schema, model, Document } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';
import { OfferType, DiscountType, BannerPosition } from '../../domain/entities/offer.entity';

export interface IOfferDocument extends Document {
  title: string;
  description?: string | null;
  code?: string | null;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  applicableBrandIds: string[];
  isLimitedTime: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  banner?: {
    imageUrl: string;
    mobileImageUrl?: string | null;
    title?: string | null;
    subtitle?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
    showOnHome: boolean;
    position: BannerPosition;
  } | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema(
  {
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String, default: null },
    title: { type: String, default: null },
    subtitle: { type: String, default: null },
    ctaText: { type: String, default: 'Shop Now' },
    ctaLink: { type: String, default: '/shop' },
    showOnHome: { type: Boolean, default: true },
    position: { 
      type: String, 
      enum: ['HERO', 'BANNER_STRIP', 'EXCLUSIVE', 'POPUP'], 
      default: 'BANNER_STRIP' 
    },
  },
  { _id: false }
);

const offerSchema = new Schema<IOfferDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    code: { type: String, default: null, trim: true, uppercase: true },
    offerType: { 
      type: String, 
      enum: ['PRODUCT', 'CATEGORY', 'BRAND', 'CELEBRATION', 'LIMITED_TIME'], 
      required: true,
      index: true 
    },
    discountType: { 
      type: String, 
      enum: ['PERCENTAGE', 'FLAT'], 
      required: true 
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: null, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    applicableProductIds: { type: [String], default: [], index: true },
    applicableCategoryIds: { type: [String], default: [], index: true },
    applicableBrandIds: { type: [String], default: [], index: true },
    isLimitedTime: { type: Boolean, default: false, index: true },
    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null, index: true },
    banner: { type: bannerSchema, default: null },
    badgeText: { type: String, default: null },
    badgeColor: { type: String, default: null },
    priority: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'offers',
  }
);

offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ 'banner.showOnHome': 1, isActive: 1 });

export const OfferModel = model<IOfferDocument>('Offer', offerSchema);

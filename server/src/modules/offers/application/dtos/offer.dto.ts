/**
 * @file offer.dto.ts
 * @layer Application › DTOs
 */

import { OfferType, DiscountType, OfferBanner } from '../../domain/entities/offer.entity';

export interface CreateOfferRequestDTO {
  title: string;
  description?: string | null;
  code?: string | null;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  applicableBrandIds?: string[];
  isLimitedTime?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  banner?: OfferBanner | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateOfferRequestDTO extends Partial<CreateOfferRequestDTO> {}

export interface OfferResponseDTO {
  id: string;
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
  banner?: OfferBanner | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  isCurrentlyValid?: boolean;
  remainingSeconds?: number | null;
}

export interface ProductBestOfferDTO {
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  bestOffer: OfferResponseDTO | null;
  allApplicableOffers: OfferResponseDTO[];
}

/**
 * @file offers.ts
 * @description API client for Offers management and storefront display.
 */

import apiClient from '@/lib/axios';

export type OfferType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'CELEBRATION' | 'LIMITED_TIME';
export type DiscountType = 'PERCENTAGE' | 'FLAT';
export type BannerPosition = 'HERO' | 'BANNER_STRIP' | 'EXCLUSIVE' | 'POPUP';

export interface OfferBanner {
  imageUrl: string;
  mobileImageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  showOnHome: boolean;
  position: BannerPosition;
}

export interface Offer {
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
  startDate?: string | null;
  endDate?: string | null;
  banner?: OfferBanner | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isCurrentlyValid?: boolean;
  remainingSeconds?: number | null;
}

export interface CreateOfferDTO {
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
  startDate?: string | null;
  endDate?: string | null;
  banner?: OfferBanner | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateOfferDTO extends Partial<CreateOfferDTO> {}

export interface ProductBestOfferDTO {
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  bestOffer: Offer | null;
  allApplicableOffers: Offer[];
}

export interface OfferProductItem {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  inStock: boolean;
}

export interface OfferWithProducts {
  offer: Offer;
  products: OfferProductItem[];
}

export const offersApi = {
  getAll: async (params?: Record<string, any>): Promise<{ data: Offer[]; total: number }> => {
    const res = await apiClient.get('/offers', { params });
    return res.data?.data || { data: [], total: 0 };
  },

  getById: async (id: string): Promise<Offer> => {
    const res = await apiClient.get(`/offers/${id}`);
    return res.data?.data;
  },

  getOfferWithProducts: async (id: string): Promise<OfferWithProducts> => {
    const res = await apiClient.get(`/offers/${id}/products`);
    return res.data?.data;
  },

  getActive: async (): Promise<Offer[]> => {
    const res = await apiClient.get('/offers/active');
    return res.data?.data || [];
  },

  getBanners: async (): Promise<Offer[]> => {
    const res = await apiClient.get('/offers/banners');
    return res.data?.data || [];
  },

  getBestOfferForProduct: async (productId: string): Promise<ProductBestOfferDTO> => {
    const res = await apiClient.get(`/offers/product/${encodeURIComponent(productId)}`);
    return res.data?.data;
  },

  create: async (data: CreateOfferDTO): Promise<Offer> => {
    const res = await apiClient.post('/offers', data);
    return res.data?.data;
  },

  update: async (id: string, data: UpdateOfferDTO): Promise<Offer> => {
    const res = await apiClient.patch(`/offers/${id}`, data);
    return res.data?.data;
  },

  toggleStatus: async (id: string): Promise<Offer> => {
    const res = await apiClient.patch(`/offers/${id}/toggle-status`);
    return res.data?.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/offers/${id}`);
  },
};

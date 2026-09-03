/**
 * @file offers.ts
 * @layer Utilities
 * 
 * Helper functions to evaluate and resolve the best active offer for any product.
 */

import { Offer } from '@/api/admin/offers';

export interface CalculatedOfferResult {
  bestOffer: Offer | null;
  hasOffer: boolean;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  discountPercentage: number;
  badgeText: string | null;
}

export function calculateBestOffer(
  product: { id: string | number; categoryId?: string | null; brandId?: string | null },
  basePrice: number,
  activeOffers: Offer[],
  comparePrice?: number | null
): CalculatedOfferResult {
  if (!activeOffers || activeOffers.length === 0 || basePrice <= 0) {
    const hasCompare = Boolean(comparePrice && comparePrice > basePrice);
    return {
      bestOffer: null,
      hasOffer: false,
      originalPrice: hasCompare ? Number(comparePrice) : basePrice,
      discountedPrice: basePrice,
      savings: hasCompare ? Number(comparePrice) - basePrice : 0,
      discountPercentage: hasCompare ? Math.round(((Number(comparePrice) - basePrice) / Number(comparePrice)) * 100) : 0,
      badgeText: null,
    };
  }

  const prodIdStr = String(product.id);
  const now = new Date();

  // Filter offers that are currently active and valid for this product
  const validOffers = activeOffers.filter((o) => {
    if (!o.isActive) return false;
    if (o.startDate && new Date(o.startDate) > now) return false;
    if (o.endDate && new Date(o.endDate) < now) return false;

    const matchesProduct = o.applicableProductIds && o.applicableProductIds.includes(prodIdStr);
    const matchesCategory = Boolean(
      product.categoryId && o.applicableCategoryIds && o.applicableCategoryIds.includes(product.categoryId)
    );
    const matchesBrand = Boolean(
      product.brandId && o.applicableBrandIds && o.applicableBrandIds.includes(product.brandId)
    );

    // If an offer has no specific scope set (e.g. storewide celebration), it applies to all products
    const isStorewide =
      (!o.applicableProductIds || o.applicableProductIds.length === 0) &&
      (!o.applicableCategoryIds || o.applicableCategoryIds.length === 0) &&
      (!o.applicableBrandIds || o.applicableBrandIds.length === 0);

    return matchesProduct || matchesCategory || matchesBrand || isStorewide;
  });

  if (validOffers.length === 0) {
    const hasCompare = Boolean(comparePrice && comparePrice > basePrice);
    return {
      bestOffer: null,
      hasOffer: false,
      originalPrice: hasCompare ? Number(comparePrice) : basePrice,
      discountedPrice: basePrice,
      savings: hasCompare ? Number(comparePrice) - basePrice : 0,
      discountPercentage: hasCompare ? Math.round(((Number(comparePrice) - basePrice) / Number(comparePrice)) * 100) : 0,
      badgeText: null,
    };
  }

  let maxSavings = 0;
  let bestOffer: Offer | null = null;

  for (const offer of validOffers) {
    let discount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discount = (basePrice * offer.discountValue) / 100;
      if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
        discount = offer.maxDiscountAmount;
      }
    } else {
      discount = offer.discountValue;
    }
    discount = Math.min(discount, basePrice);

    if (discount > maxSavings) {
      maxSavings = discount;
      bestOffer = offer;
    }
  }

  if (!bestOffer || maxSavings <= 0) {
    const hasCompare = Boolean(comparePrice && comparePrice > basePrice);
    return {
      bestOffer: null,
      hasOffer: false,
      originalPrice: hasCompare ? Number(comparePrice) : basePrice,
      discountedPrice: basePrice,
      savings: hasCompare ? Number(comparePrice) - basePrice : 0,
      discountPercentage: hasCompare ? Math.round(((Number(comparePrice) - basePrice) / Number(comparePrice)) * 100) : 0,
      badgeText: null,
    };
  }

  const discountedPrice = Math.max(0, Math.round(basePrice - maxSavings));
  
  // When a product has compare amount, cross that amount!
  // If not compare amount, then only cross the price amount!
  const strikePrice = comparePrice && comparePrice > discountedPrice ? comparePrice : basePrice;
  const discountPercentage = strikePrice > discountedPrice
    ? Math.round(((strikePrice - discountedPrice) / strikePrice) * 100)
    : Math.round((maxSavings / basePrice) * 100);

  const badgeText =
    bestOffer.badgeText ||
    (bestOffer.discountType === 'PERCENTAGE'
      ? `${bestOffer.discountValue}% OFF`
      : `₹${bestOffer.discountValue} OFF`);

  return {
    bestOffer,
    hasOffer: true,
    originalPrice: strikePrice,
    discountedPrice,
    savings: Math.round(strikePrice - discountedPrice),
    discountPercentage,
    badgeText,
  };
}

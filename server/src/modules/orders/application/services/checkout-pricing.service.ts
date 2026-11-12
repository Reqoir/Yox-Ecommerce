/**
 * @file checkout-pricing.service.ts
 * @layer Application › Services
 *
 * SEC-CRIT-002: Authoritative server-side checkout pricing engine.
 * Always resolves live catalog pricing and active offer rules from MongoDB,
 * ignoring any client-supplied or stale cart item prices.
 */

import mongoose from 'mongoose';
import {
  ApplicationError,
  ConflictError,
} from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { ProductRepository } from '../../../products/infrastructure/repositories/product.repository';
import { IOfferRepository } from '../../../offers/domain/repositories/offer.repository.interface';
import { OfferRepository } from '../../../offers/infrastructure/repositories/offer.repository';
import { Offer } from '../../../offers/domain/entities/offer.entity';
import { SettingsModel } from '../../../settings/infrastructure/models/settings.model';
import { OrderModel } from '../../infrastructure/models/order.model';
import { OrderItemSnapshot } from '../../domain/entities/order.entity';

export interface StoreCheckoutConfig {
  maintenanceMode: boolean;
  codEnabled: boolean;
  codMaxLimit: number;
  isTaxInclusive: boolean;
  taxRatePercent: number;
}

export interface PricedCheckoutInputItem {
  variantId: string;
  quantity: unknown;
  price?: unknown;
  image?: string | null;
  imageUrl?: string | null;
}

export interface CheckoutPricingResult {
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  couponId: string | null;
  storeConfig: StoreCheckoutConfig;
}

const DEFAULT_STORE_CONFIG: StoreCheckoutConfig = {
  maintenanceMode: false,
  codEnabled: true,
  codMaxLimit: 5000,
  isTaxInclusive: true,
  taxRatePercent: 18,
};

export interface CheckoutPricingDependencies {
  variantRepo?: IProductVariantRepository;
  productRepo?: IProductRepository;
  offerRepo?: IOfferRepository;
  getStoreConfig?: () => Promise<Partial<StoreCheckoutConfig>>;
  countUserCouponUsage?: (userId: string, couponId: string) => Promise<number>;
}

export class CheckoutPricingService {
  private readonly variantRepo: IProductVariantRepository;
  private readonly productRepo?: IProductRepository;
  private readonly offerRepo?: IOfferRepository;
  private readonly customGetStoreConfig?: () => Promise<Partial<StoreCheckoutConfig>>;
  private readonly customCountUserCouponUsage?: (userId: string, couponId: string) => Promise<number>;

  constructor(deps: CheckoutPricingDependencies = {}) {
    this.variantRepo = deps.variantRepo ?? new ProductVariantRepository();
    this.productRepo = deps.productRepo ?? (mongoose.connection.readyState === 1 ? new ProductRepository() : undefined);
    this.offerRepo = deps.offerRepo ?? (mongoose.connection.readyState === 1 ? new OfferRepository() : undefined);
    this.customGetStoreConfig = deps.getStoreConfig;
    this.customCountUserCouponUsage = deps.countUserCouponUsage;
  }

  public async loadStoreConfig(): Promise<StoreCheckoutConfig> {
    if (this.customGetStoreConfig) {
      const custom = await this.customGetStoreConfig();
      return { ...DEFAULT_STORE_CONFIG, ...custom };
    }
    if (mongoose.connection.readyState !== 1) {
      return { ...DEFAULT_STORE_CONFIG };
    }
    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (!storeSetting?.value) return { ...DEFAULT_STORE_CONFIG };
      return {
        maintenanceMode: Boolean(storeSetting.value.maintenanceMode),
        codEnabled: typeof storeSetting.value.codEnabled === 'boolean' ? storeSetting.value.codEnabled : true,
        codMaxLimit: typeof storeSetting.value.codMaxLimit === 'number' ? storeSetting.value.codMaxLimit : 5000,
        isTaxInclusive: typeof storeSetting.value.isTaxInclusive === 'boolean' ? storeSetting.value.isTaxInclusive : true,
        taxRatePercent: typeof storeSetting.value.taxRatePercent === 'number' ? storeSetting.value.taxRatePercent : 18,
      };
    } catch {
      return { ...DEFAULT_STORE_CONFIG };
    }
  }

  public async calculateCheckoutPricing(input: {
    userId: string;
    items: PricedCheckoutInputItem[];
    couponId?: string | null;
  }): Promise<CheckoutPricingResult> {
    const storeConfig = await this.loadStoreConfig();
    if (storeConfig.maintenanceMode) {
      throw new ApplicationError(
        'The store is currently undergoing scheduled maintenance. Order placement is temporarily paused. Please check back shortly.',
        'MAINTENANCE_MODE'
      );
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new ValidationError('At least one checkout item is required');
    }

    interface ResolvedLine {
      snapshot: OrderItemSnapshot;
      productId: string;
      categoryId?: string | null;
      brandId?: string | null;
    }

    const resolvedLines: ResolvedLine[] = [];

    for (const rawItem of input.items) {
      if (!rawItem.variantId || typeof rawItem.variantId !== 'string') {
        throw new ValidationError('Each checkout item must specify a valid variantId');
      }

      const qty = typeof rawItem.quantity === 'number' ? rawItem.quantity : Number(rawItem.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        throw new ValidationError('Item quantity must be a positive integer between 1 and 100');
      }

      // Reject explicitly malformed/negative client-supplied prices (never trust them even when valid)
      if (rawItem.price !== undefined && rawItem.price !== null) {
        const clientPrice = Number(rawItem.price);
        if (!Number.isFinite(clientPrice) || clientPrice <= 0) {
          throw new ValidationError('Invalid client price supplied');
        }
      }

      const variant = await this.variantRepo.findById(rawItem.variantId);
      if (!variant) {
        throw new NotFoundError(`Product variant ${rawItem.variantId} no longer exists`);
      }
      if (!variant.isActive) {
        throw new ConflictError(`"${variant.title || 'Item'}" is currently unavailable`);
      }
      if (!Number.isFinite(variant.price) || variant.price < 0) {
        throw new ConflictError(`"${variant.title || 'Item'}" has invalid catalog pricing`);
      }
      if (variant.stock < qty) {
        throw new ConflictError(
          `Insufficient stock for "${variant.title || 'item'}". Available: ${variant.stock}, Requested: ${qty}`
        );
      }

      let productName = variant.title || 'Product';
      let categoryId: string | null = null;
      let brandId: string | null = null;
      let fallbackImage: string | null = null;

      if (this.productRepo && variant.productId) {
        const product = await this.productRepo.findById(variant.productId);
        if (product) {
          if (!product.isActive) {
            throw new ConflictError(`Product "${product.name}" is currently unavailable`);
          }
          productName = product.name || productName;
          categoryId = product.categoryId || null;
          brandId = product.brandId || null;
          fallbackImage = product.thumbnail || null;
        }
      }

      // Authoritative unit price ALWAYS comes from database catalog
      const unitPrice = Number(Number(variant.price).toFixed(2));
      const lineSubtotal = Number((unitPrice * qty).toFixed(2));
      const displayName = variant.color ? `${variant.title || productName} - ${variant.color}` : productName;

      resolvedLines.push({
        productId: variant.productId,
        categoryId,
        brandId,
        snapshot: {
          productId: variant.productId,
          variantId: variant.id,
          productName: displayName,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity: qty,
          unitPrice,
          discount: 0,
          subtotal: lineSubtotal,
          imageUrl: (variant as any).images?.[0] || rawItem.image || rawItem.imageUrl || fallbackImage || null,
        },
      });
    }

    const subtotal = Number(
      resolvedLines.reduce((sum, line) => sum + line.snapshot.subtotal, 0).toFixed(2)
    );

    let discount = 0;
    let validatedCouponId: string | null = null;

    if (input.couponId && typeof input.couponId === 'string' && input.couponId.trim().length > 0) {
      const couponKey = input.couponId.trim();
      const offer = await this.resolveOffer(couponKey);
      if (!offer) {
        throw new ValidationError('Invalid coupon or offer code');
      }
      if (!offer.isCurrentlyValid()) {
        throw new ValidationError('This coupon has expired or is no longer active');
      }
      if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit) {
        throw new ValidationError('This coupon has reached its maximum usage limit');
      }
      if (offer.perUserLimit != null) {
        const userUsage = await this.getUserCouponUsage(input.userId, offer.id || couponKey);
        if (userUsage >= offer.perUserLimit) {
          throw new ValidationError('You have already reached the per-user usage limit for this coupon');
        }
      }

      const hasScope =
        offer.applicableProductIds.length > 0 ||
        offer.applicableCategoryIds.length > 0 ||
        offer.applicableBrandIds.length > 0;

      const eligibleLines = hasScope
        ? resolvedLines.filter(
            (l) =>
              offer.applicableProductIds.includes(l.productId) ||
              (l.categoryId ? offer.applicableCategoryIds.includes(l.categoryId) : false) ||
              (l.brandId ? offer.applicableBrandIds.includes(l.brandId) : false)
          )
        : resolvedLines;

      const eligibleSubtotal = Number(
        eligibleLines.reduce((sum, line) => sum + line.snapshot.subtotal, 0).toFixed(2)
      );

      if (eligibleSubtotal <= 0) {
        throw new ValidationError('This coupon is not applicable to any item in your order');
      }
      if (offer.minOrderValue != null && eligibleSubtotal < offer.minOrderValue) {
        throw new ValidationError(
          `Minimum order value of ₹${offer.minOrderValue} is required to apply this coupon`
        );
      }

      let rawDiscount = 0;
      if (offer.discountType === 'PERCENTAGE') {
        const pct = Math.max(0, Math.min(100, offer.discountValue));
        rawDiscount = (eligibleSubtotal * pct) / 100;
      } else {
        rawDiscount = Math.max(0, offer.discountValue);
      }

      if (offer.maxDiscountAmount != null && offer.maxDiscountAmount > 0) {
        rawDiscount = Math.min(rawDiscount, offer.maxDiscountAmount);
      }

      discount = Number(Math.max(0, Math.min(eligibleSubtotal, rawDiscount)).toFixed(2));
      validatedCouponId = offer.id || couponKey;

      // Proportionally allocate discount across eligible items
      if (discount > 0 && eligibleLines.length > 0) {
        let allocated = 0;
        eligibleLines.forEach((line, index) => {
          if (index === eligibleLines.length - 1) {
            line.snapshot.discount = Number(Math.max(0, discount - allocated).toFixed(2));
          } else {
            const share = Number(((line.snapshot.subtotal / eligibleSubtotal) * discount).toFixed(2));
            line.snapshot.discount = share;
            allocated = Number((allocated + share).toFixed(2));
          }
        });
      }
    }

    const shippingCharge = 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = storeConfig.isTaxInclusive
      ? 0
      : Number(((taxableAmount * storeConfig.taxRatePercent) / 100).toFixed(2));
    const totalAmount = Number(Math.max(0, taxableAmount + shippingCharge + tax).toFixed(2));

    return {
      items: resolvedLines.map((l) => l.snapshot),
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      couponId: validatedCouponId,
      storeConfig,
    };
  }

  private async resolveOffer(couponKey: string): Promise<Offer | null> {
    if (!this.offerRepo) return null;
    if (mongoose.Types.ObjectId.isValid(couponKey)) {
      const byId = await this.offerRepo.findById(couponKey);
      if (byId) return byId;
    }
    return this.offerRepo.findByCode(couponKey);
  }

  private async getUserCouponUsage(userId: string, couponId: string): Promise<number> {
    if (this.customCountUserCouponUsage) {
      return this.customCountUserCouponUsage(userId, couponId);
    }
    if (mongoose.connection.readyState !== 1) return 0;
    return OrderModel.countDocuments({
      userId,
      couponId,
      orderStatus: { $ne: 'CANCELLED' },
      paymentStatus: { $ne: 'FAILED' },
    }).exec();
  }

  public async atomicClaimCoupon(offerId: string | null | undefined): Promise<boolean> {
    if (!offerId || !this.offerRepo?.atomicIncrementUsage) {
      return false;
    }
    const updated = await this.offerRepo.atomicIncrementUsage(offerId);
    if (!updated) {
      throw new ValidationError('This coupon has reached its maximum usage limit or is no longer active');
    }
    return true;
  }

  public async releaseCouponClaim(offerId: string | null | undefined): Promise<void> {
    if (!offerId || !this.offerRepo?.atomicDecrementUsage) {
      return;
    }
    await this.offerRepo.atomicDecrementUsage(offerId).catch(() => undefined);
  }
}

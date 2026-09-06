/**
 * @file get-checkout-summary.use-case.ts
 * @layer Application
 * 
 * Use case to compute and retrieve the current checkout summary based on a user's cart.
 */

import { IUseCase } from '../../../../core/application/use-cases/base.use-case.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { CheckoutSummaryResponseDTO } from '../dtos/checkout.dto';
import { CartItemResponseDTO } from '../../../cart/application/dtos/cart.dto';
import { SettingsModel } from '../../../settings/infrastructure/models/settings.model';

export class GetCheckoutSummaryUseCase implements IUseCase<string, CheckoutSummaryResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo?: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(userId: string): Promise<CheckoutSummaryResponseDTO> {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cannot generate checkout summary for an empty cart');
    }

    const enrichedItems: CartItemResponseDTO[] = [];
    for (const item of cart.items) {
      let productId: string | undefined;
      let name: string | undefined;
      let slug: string | undefined;
      let image: string | undefined;
      let color: string | undefined;
      let size: string | undefined;
      let stock: number | undefined;
      let comparePrice: number | null | undefined;

      if (this.variantRepo) {
        try {
          const variant = await this.variantRepo.findById(item.variantId);
          if (variant) {
            productId = variant.productId;
            color = variant.color || undefined;
            size = variant.size || undefined;
            stock = variant.stock;
            comparePrice = variant.comparePrice || null;
            image = variant.images?.[0];

            if (this.productRepo && variant.productId) {
              const product = await this.productRepo.findById(variant.productId);
              if (product) {
                name = product.name;
                slug = product.slug;
                if (!image && product.thumbnail) {
                  image = product.thumbnail;
                }
              }
            }
          }
        } catch (error) {
          // Fallback if lookup fails
        }
      }

      enrichedItems.push({
        variantId: item.variantId,
        productId,
        name: name || `Product Variant (${item.variantId})`,
        slug,
        image: image || '/images/default-product.png',
        color: color || 'Default',
        size: size || 'Standard',
        stock: stock !== undefined ? stock : 99,
        price: item.price,
        comparePrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }

    const subtotal = cart.totalAmount;
    const discountAmount = cart.discountAmount || 0;
    
    // Fetch dynamic store configuration
    let freeShippingThreshold = 699;
    let standardShippingFee = 99;
    let isTaxInclusive = true;
    let taxRatePercent = 18;

    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (storeSetting?.value) {
        if (typeof storeSetting.value.freeShippingThreshold === 'number') {
          freeShippingThreshold = storeSetting.value.freeShippingThreshold;
        }
        if (typeof storeSetting.value.standardShippingFee === 'number') {
          standardShippingFee = storeSetting.value.standardShippingFee;
        }
        if (typeof storeSetting.value.isTaxInclusive === 'boolean') {
          isTaxInclusive = storeSetting.value.isTaxInclusive;
        }
        if (typeof storeSetting.value.taxRatePercent === 'number') {
          taxRatePercent = storeSetting.value.taxRatePercent;
        }
      }
    } catch (e) {}

    const shippingAmount = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = isTaxInclusive ? 0 : parseFloat(((taxableAmount * taxRatePercent) / 100).toFixed(2));

    const total = parseFloat((taxableAmount + shippingAmount + taxAmount).toFixed(2));

    return {
      cartId: cart.id,
      items: enrichedItems,
      totalItems: cart.totalItems,
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      total,
    };
  }
}

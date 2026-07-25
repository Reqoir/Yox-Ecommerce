/**
 * @file get-checkout-summary.use-case.ts
 * @layer Application
 * 
 * Use case to compute and retrieve the current checkout summary based on a user's cart.
 */

import { IUseCase } from '../../../../core/application/use-cases/base.use-case.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { CheckoutSummaryResponseDTO } from '../dtos/checkout.dto';

export class GetCheckoutSummaryUseCase implements IUseCase<string, CheckoutSummaryResponseDTO> {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(userId: string): Promise<CheckoutSummaryResponseDTO> {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cannot generate checkout summary for an empty cart');
    }

    const subtotal = cart.totalAmount;
    const discountAmount = cart.discountAmount || 0;
    
    // Simple business logic: Free shipping over $500, otherwise $50
    const shippingAmount = subtotal >= 500 ? 0 : 50;

    // 10% standard tax on discounted total
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = parseFloat((taxableAmount * 0.10).toFixed(2));

    const total = parseFloat((taxableAmount + shippingAmount + taxAmount).toFixed(2));

    return {
      cartId: cart.id,
      items: cart.items.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
      })),
      totalItems: cart.totalItems,
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      total,
    };
  }
}

/**
 * @file checkout.dto.ts
 * @layer Application
 * 
 * Data Transfer Objects for the Checkout module.
 */

import { CartItemResponseDTO } from '../../../cart/application/dtos/cart.dto';

export interface CheckoutSummaryResponseDTO {
  cartId: string;
  items: CartItemResponseDTO[];
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}

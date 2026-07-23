/**
 * @file cart.dto.ts
 * @layer Application
 * 
 * Data Transfer Objects for the Cart module.
 */

import { z } from 'zod';

export const AddCartItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export type AddCartItemDTO = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be at least 0"),
});

export type UpdateCartItemDTO = z.infer<typeof UpdateCartItemSchema>;

export interface CartItemResponseDTO {
  variantId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CartResponseDTO {
  id: string;
  userId: string;
  items: CartItemResponseDTO[];
  totalItems: number;
  totalAmount: number;
  couponId?: string | null;
  discountAmount?: number | null;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

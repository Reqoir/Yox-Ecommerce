/**
 * @file order.validator.ts
 * @layer Application › Validators
 */

import { z } from 'zod';

export const directBuyItemSchema = z.object({
  variantId: z.string().trim().min(1, 'variantId is required'),
  quantity: z
    .number({ message: 'Quantity must be an integer' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100 per item'),
  // Optional for backwards-compatibility with older clients; always rejected if <= 0 and never trusted
  price: z.number().optional(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient full name is required'),
  phone: z.string().trim().min(7, 'Valid phone number is required'),
  streetAddress: z.string().trim().min(3, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  country: z.string().trim().min(2).optional().default('India'),
  postalCode: z.string().trim().min(4, 'Postal code is required'),
});

export const placeOrderSchema = z.object({
  addressId: z.string().trim().min(1).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  paymentMethod: z.string().trim().optional().default('COD'),
  couponId: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  directBuyItem: directBuyItemSchema.optional(),
});


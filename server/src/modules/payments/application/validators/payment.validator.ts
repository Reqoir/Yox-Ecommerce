/**
 * @file payment.validator.ts
 * @layer Application › Validators
 */

import { z } from 'zod';
import { directBuyItemSchema, shippingAddressSchema } from '../../../orders/application/validators/order.validator';

export const createRazorpayOrderSchema = z.object({
  addressId: z.string().trim().min(1).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  couponId: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  directBuyItem: directBuyItemSchema.optional(),
});

export const verifyRazorpayPaymentSchema = z.object({
  orderId: z.string().trim().min(1, 'orderId is required'),
  razorpayOrderId: z.string().trim().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().trim().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().trim().min(1, 'razorpaySignature is required'),
});

export const failPaymentOrderSchema = z.object({
  orderId: z.string().trim().min(1, 'orderId is required'),
  razorpayPaymentId: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const processRefundSchema = z.object({
  orderId: z.string().trim().min(1, 'orderId is required'),
  returnId: z.string().trim().nullable().optional(),
  amount: z.number().positive('Refund amount must be positive').optional(),
  reason: z.string().trim().max(500).optional(),
});


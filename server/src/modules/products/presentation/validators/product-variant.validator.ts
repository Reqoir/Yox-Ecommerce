/**
 * @file product-variant.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const createProductVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'SKU is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  color: z.string().min(1, 'Color is required').max(50),
  price: z.number().positive('Price must be greater than 0'),
  comparePrice: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(10),
  weight: z.number().positive().optional().nullable(),
  barcode: z.string().optional().nullable(),
  images: z.array(z.string().url('Image must be a valid URL')).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  size: z.string().optional().nullable(),
});

export const updateProductVariantSchema = createProductVariantSchema.partial();

export const productVariantListQuerySchema = z.object({
  productId: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
});

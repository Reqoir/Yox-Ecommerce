/**
 * @file inventory.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const updateInventorySchema = z.object({
  availableStock: z.number().min(0).optional(),
  reservedStock: z.number().min(0).optional(),
  damagedStock: z.number().min(0).optional(),
  warehouseLocation: z.string().optional().nullable(),
});

export const adjustStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  amount: z.number().min(0, "Amount must be a non-negative number. For ADJUSTMENT, if you want to decrease, use OUT type, or if you support negative adjustment amounts, update the validation accordingly. Assuming positive amounts for all types."),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export const inventoryListQuerySchema = z.object({
  warehouseLocation: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const stockLogListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

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
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const adjustStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  amount: z.number().min(0),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export const reserveStockSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reference: z.string().optional(),
});

export const releaseStockSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  action: z.enum(['CANCEL', 'FULFILL']),
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

export const lowStockQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

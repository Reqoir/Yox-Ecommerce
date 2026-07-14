/**
 * @file category.validator.ts
 * @layer Presentation › Validators
 * 
 * Zod schemas for validating category requests.
 */

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255),
  description: z.string().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  icon: z.string().optional().nullable(),
  parentCategoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  search: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  parentCategoryId: z.string().optional(),
});

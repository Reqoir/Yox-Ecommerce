/**
 * @file brand.validator.ts
 * @layer Presentation › Validators
 *
 * Zod schemas for validating Brand requests.
 */

import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  slug: z.string().min(2, 'Slug must be at least 2 characters long').trim(),
  logo: z.string().url('Logo must be a valid URL').optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().url('Website must be a valid URL').optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(2).trim().optional(),
  slug: z.string().min(2).trim().optional(),
  logo: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const getBrandSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid brand ID format'),
});

export const deleteBrandSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid brand ID format'),
});

export const getAllBrandsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

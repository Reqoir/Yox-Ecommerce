/**
 * @file product.validator.ts
 * @layer Presentation › Validators
 * 
 * Zod schemas for validating Product-related incoming requests.
 */

import { z } from 'zod';

export const productVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  color: z.string().min(1, 'Color is required').max(50),
  price: z.number().min(0, 'Price cannot be negative'),
  comparePrice: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(10),
  weight: z.number().min(0).optional().nullable(),
  barcode: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  size: z.string().optional().nullable(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(255),
  categoryId: z.string().optional().nullable(),
  subCategoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  fit: z.string().optional().nullable(),
  tag: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().max(100).optional().nullable(),
  seoDescription: z.string().max(255).optional().nullable(),
  variants: z.array(productVariantSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  q: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.string().optional(),
  categorySlug: z.string().optional(),
  subCategoryId: z.string().optional(),
  subCategoryIds: z.union([z.string(), z.array(z.string())]).optional(),
  subCategory: z.string().optional(),
  brandId: z.string().optional(),
  brandIds: z.union([z.string(), z.array(z.string())]).optional(),
  brand: z.string().optional(),
  brandSlug: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  color: z.string().optional(),
  colors: z.union([z.string(), z.array(z.string())]).optional(),
  size: z.string().optional(),
  sizes: z.union([z.string(), z.array(z.string())]).optional(),
  fit: z.string().optional(),
  fits: z.union([z.string(), z.array(z.string())]).optional(),
  tag: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  inStock: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
  onSale: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
  hasDiscount: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
  minRating: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  isFeatured: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : (val === 'false' ? false : undefined)),
  sort: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
});

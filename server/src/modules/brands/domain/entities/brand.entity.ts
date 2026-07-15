/**
 * @file brand.entity.ts
 * @layer Domain › Entities
 *
 * Defines the core domain entity for a Brand.
 */

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

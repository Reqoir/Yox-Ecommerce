/**
 * @file brand.dto.ts
 * @layer Application › DTOs
 *
 * Data Transfer Objects for Brand.
 */

export interface CreateBrandDTO {
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateBrandDTO {
  name?: string;
  slug?: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

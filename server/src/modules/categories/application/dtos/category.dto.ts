/**
 * @file category.dto.ts
 * @layer Application › DTOs
 * 
 * Defines Data Transfer Objects for the Category module.
 */

export interface CreateCategoryRequestDTO {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateCategoryRequestDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

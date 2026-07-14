/**
 * @file product.dto.ts
 * @layer Application › DTOs
 */

export interface CreateProductRequestDTO {
  name: string;
  slug: string;
  categoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  
  variants?: {
    sku: string;
    title: string;
    color: string;
    price: number;
    comparePrice?: number | null;
    costPrice?: number | null;
    stock: number;
    lowStockThreshold?: number;
    weight?: number | null;
    barcode?: string | null;
    images?: string[];
    isDefault?: boolean;
    isActive?: boolean;
  }[];
}

export interface UpdateProductRequestDTO extends Partial<CreateProductRequestDTO> {}

export interface ProductResponseDTO {
  id: string;
  name: string;
  slug: string;
  categoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  salesCount: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants?: any[];
}

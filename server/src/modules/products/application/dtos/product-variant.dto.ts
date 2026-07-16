/**
 * @file product-variant.dto.ts
 * @layer Application › DTOs
 */

export interface CreateProductVariantRequestDTO {
  productId: string;
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
  size?: string | null;
}

export interface UpdateProductVariantRequestDTO extends Partial<CreateProductVariantRequestDTO> {}

export interface ProductVariantResponseDTO {
  id: string;
  productId: string;
  sku: string;
  title: string;
  color: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  weight?: number | null;
  barcode?: string | null;
  images: string[];
  isDefault: boolean;
  isActive: boolean;
  size?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

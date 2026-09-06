/**
 * @file product.dto.ts
 * @layer Application › DTOs
 */

export interface CreateProductRequestDTO {
  name: string;
  slug: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  fit?: string | null;
  tag?: string | null;
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
    size?: string | null;
  }[];
}

export interface UpdateProductRequestDTO extends Partial<CreateProductRequestDTO> {}

export interface ProductResponseDTO {
  id: string;
  name: string;
  slug: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  fit?: string | null;
  tag?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  salesCount: number;
  averageRating?: number;
  reviewCount?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants?: any[];
}

export interface ProductFilterQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
  category?: string;
  subCategoryId?: string;
  subCategoryIds?: string[];
  subCategory?: string;
  brandId?: string;
  brandIds?: string[];
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  colors?: string[];
  size?: string;
  sizes?: string[];
  fit?: string;
  fits?: string[];
  tag?: string;
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  minRating?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  sort?:
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'oldest'
    | 'best_selling'
    | 'rating'
    | 'discount'
    | 'name_asc'
    | 'name_desc'
    | 'relevance'
    | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 1 | -1;
}

export interface FacetItemDTO {
  id?: string;
  name?: string;
  slug?: string;
  value?: string;
  count: number;
}

export interface ProductFilterFacetsDTO {
  totalProducts: number;
  priceRange: {
    min: number;
    max: number;
  };
  categories: FacetItemDTO[];
  brands: FacetItemDTO[];
  sizes: { value: string; count: number }[];
  colors: { value: string; count: number }[];
  fits: { value: string; count: number }[];
  tags: { value: string; count: number }[];
}

export interface PaginatedProductsDTO {
  data: ProductResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

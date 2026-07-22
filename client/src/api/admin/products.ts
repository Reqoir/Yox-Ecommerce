import apiClient from '@/lib/axios';

export interface ProductVariant {
  id?: string;
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

export interface Product {
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
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export interface CreateProductDTO {
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
  variants?: Omit<ProductVariant, 'id'>[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export const productApi = {
  getAll: async (params?: Record<string, any>) => {
    const response = await apiClient.get<{ data: { data: Product[]; total: number } }>('/products', { params });
    return response.data.data.data || [];
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Product }>(`/products/${id}`);
    return response.data.data;
  },
  
  create: async (data: CreateProductDTO) => {
    const response = await apiClient.post<{ data: Product }>('/products', data);
    return response.data.data;
  },
  
  update: async (id: string, data: UpdateProductDTO) => {
    const response = await apiClient.patch<{ data: Product }>(`/products/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};

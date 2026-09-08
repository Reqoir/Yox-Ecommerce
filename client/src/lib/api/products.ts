import apiClient from '../axios';

export interface BackendProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  isDefault: boolean;
  stock: number;
}

export interface BackendProduct {
  id: string;
  name: string;
  slug?: string;
  categoryId: string;
  subCategoryId?: string | null;
  brandId?: string | null;
  fit?: string | null;
  shortDescription?: string;
  description?: string;
  thumbnail: string;
  tag?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants: BackendProductVariant[];
}

export const productsApi = {
  getProductById: async (id: string): Promise<BackendProduct> => {
    try {
      const response = await apiClient.get(`/products/${encodeURIComponent(id)}`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Try clean id if compound id was provided
    }

    const cleanId = id.includes('__') ? id.split('__')[0] : id;
    if (cleanId !== id) {
      try {
        const response = await apiClient.get(`/products/${encodeURIComponent(cleanId)}`);
        if (response.data?.data) {
          return response.data.data;
        }
      } catch (e) {
        // failed
      }
    }

    throw new Error('Product not found');
  },
  
  getProducts: async (): Promise<{ data: BackendProduct[]; total: number }> => {
    try {
      const response = await apiClient.get('/products');
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('[productsApi] getProducts failed, returning empty data fallback.');
    }
    return { data: [], total: 0 };
  },

  getSimilarProducts: async (params: {
    categoryId?: string;
    brandId?: string;
    excludeId?: string;
    limit?: number;
  }): Promise<{ data: BackendProduct[]; total: number }> => {
    try {
      const queryParams: Record<string, string> = {
        limit: String(params.limit || 8),
      };
      if (params.categoryId) queryParams.categoryId = params.categoryId;
      if (params.brandId) queryParams.brandId = params.brandId;

      const response = await apiClient.get('/products', { params: queryParams });
      if (response.data?.data) {
        const result = response.data.data as { data: BackendProduct[]; total: number };
        // Exclude the current product
        if (params.excludeId) {
          result.data = result.data.filter(
            (p) => p.id !== params.excludeId && p.slug !== params.excludeId
          );
        }
        return result;
      }
    } catch (error) {
      console.warn('[productsApi] getSimilarProducts failed.');
    }
    return { data: [], total: 0 };
  },
};


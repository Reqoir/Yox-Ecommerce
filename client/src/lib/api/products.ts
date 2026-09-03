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
  }
};


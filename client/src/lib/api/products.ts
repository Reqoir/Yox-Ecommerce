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
  categoryId: string;
  shortDescription?: string;
  description?: string;
  thumbnail: string;
  tag?: string;
  variants: BackendProductVariant[];
}

export const productsApi = {
  getProductById: async (id: string): Promise<BackendProduct> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data?.data;
  },
  
  getProducts: async (): Promise<{ data: BackendProduct[]; total: number }> => {
    const response = await apiClient.get('/products');
    return response.data?.data;
  }
};

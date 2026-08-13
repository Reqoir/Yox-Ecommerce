import apiClient from '../axios';
import { MOCK_PRODUCTS } from '@/constants/products';

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
    try {
      const response = await apiClient.get(`/products/${id}`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`[productsApi] API getProductById(${id}) failed or endpoint unpopulated, checking fallback mock products.`);
    }

    // Fallback to mock product matching id
    const mock = MOCK_PRODUCTS.find((p) => String(p.id) === String(id));
    if (mock) {
      return {
        id: String(mock.id),
        name: mock.name,
        categoryId: mock.category,
        description: mock.description,
        thumbnail: mock.image,
        tag: mock.tag,
        variants: (mock.colors || ['Default']).flatMap((color, cIdx) =>
          (mock.sizes || ['Standard']).map((size, sIdx) => ({
            id: `var-${mock.id}-${cIdx}-${sIdx}`,
            color: color,
            size: size,
            price: mock.price,
            comparePrice: mock.originalPrice,
            images: mock.images && mock.images.length > 0 ? mock.images : [mock.image],
            isDefault: cIdx === 0 && sIdx === 0,
            stock: 15,
          }))
        ),
      };
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


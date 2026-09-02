import apiClient from '../axios';

export interface WishlistProductItem {
  id?: string;
  productId: string;
  color?: string | null;
  productName: string;
  productSlug?: string;
  productPrice: number;
  productComparePrice?: number | null;
  productImage: string;
  productCategory: string;
  productTag?: string | null;
  productFit?: string | null;
  productStock: number;
  inStock: boolean;
  addedAt: string;
}

export interface WishlistResponse {
  success: boolean;
  data: {
    id: string | null;
    userId: string;
    items: WishlistProductItem[];
    inWishlist?: boolean;
  };
  message?: string;
}

export const wishlistsApi = {
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await apiClient.get<WishlistResponse>('/wishlists');
    return response.data;
  },

  toggleWishlist: async (productId: string, color?: string | null): Promise<WishlistResponse> => {
    const response = await apiClient.post<WishlistResponse>('/wishlists/toggle', {
      productId,
      color: color || null,
    });
    return response.data;
  },

  clearWishlist: async (): Promise<WishlistResponse> => {
    const response = await apiClient.delete<WishlistResponse>('/wishlists/clear');
    return response.data;
  },
};

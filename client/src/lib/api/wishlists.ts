import apiClient from '../axios';

export const wishlistsApi = {
  getWishlist: async () => {
    const response = await apiClient.get('/wishlists');
    return response.data;
  },

  toggleWishlist: async (productId: string) => {
    const response = await apiClient.post('/wishlists/toggle', { productId });
    return response.data;
  },
};

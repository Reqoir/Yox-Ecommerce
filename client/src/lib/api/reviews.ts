import apiClient from '../axios';

export interface ReviewData {
  rating: number;
  title?: string;
  comment?: string;
}

export const reviewsApi = {
  createReview: async (productId: string, data: ReviewData) => {
    const response = await apiClient.post('/reviews', { productId, ...data });
    return response.data;
  },

  getProductReviews: async (productId: string, params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },
};

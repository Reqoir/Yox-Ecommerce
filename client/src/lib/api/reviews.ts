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

  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/reviews/mine', { params });
    return response.data.data;
  },

  getAllReviews: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get('/reviews/admin/all', { params });
    return response.data.data;
  },

  updateReviewStatus: async (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const response = await apiClient.patch(`/reviews/admin/${id}/status`, { status });
    return response.data.data;
  },
};

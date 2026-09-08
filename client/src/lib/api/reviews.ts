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

  getAllReviews: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await apiClient.get('/reviews/admin/all', { params });
    const payload = response.data?.data;
    const isArray = Array.isArray(payload);

    const reviews = isArray ? payload : (payload?.reviews || []);
    const total = isArray ? reviews.length : (payload?.total ?? reviews.length);
    const page = isArray ? (params?.page || 1) : (payload?.page ?? 1);
    const totalPages = isArray ? 1 : (payload?.totalPages ?? 1);
    const counts = isArray 
      ? { all: total, pending: 0, approved: total, rejected: 0 } 
      : (payload?.counts || response.data?.counts || { all: total, pending: 0, approved: 0, rejected: 0 });

    return {
      reviews,
      pagination: {
        total,
        page,
        limit: params?.limit || 20,
        totalPages,
      },
      counts,
    };
  },

  updateReviewStatus: async (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const response = await apiClient.patch(`/reviews/admin/${id}/status`, { status });
    return response.data.data;
  },

  deleteReview: async (id: string) => {
    const response = await apiClient.delete(`/reviews/admin/${id}`);
    return response.data;
  },
};

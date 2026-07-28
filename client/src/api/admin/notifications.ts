import apiClient from '@/lib/axios';

export interface Notification {
  id: string;
  userId: string | null;
  type: 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export const notificationApi = {
  getAll: async (params?: { type?: string; isRead?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<{
      data: { data: Notification[]; total: number; unreadCount: number };
    }>('/notifications', { params });
    return response.data.data;
  },

  markRead: async (id: string) => {
    const response = await apiClient.patch<{ data: Notification }>(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllRead: async () => {
    await apiClient.patch('/notifications/read-all');
  },

  delete: async (id: string) => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

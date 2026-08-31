import apiClient from '@/lib/axios';

export const settingsApi = {
  getSetting: async <T>(key: string): Promise<T | null> => {
    const response = await apiClient.get<{ success: boolean; data: T }>(`/settings/${key}`);
    return response.data.data;
  },
  
  updateSetting: async <T>(key: string, value: T): Promise<T> => {
    const response = await apiClient.put<{ success: boolean; data: T }>(`/settings/${key}`, { value });
    return response.data.data;
  }
};

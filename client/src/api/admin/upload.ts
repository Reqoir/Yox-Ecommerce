import apiClient from '@/lib/axios';

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post<{ data: { url: string } }>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data.url;
  },

  uploadMultipleImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post<{ data: { urls: string[] } }>('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data.urls || [];
  }
};

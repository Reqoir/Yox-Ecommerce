import apiClient from '@/lib/axios';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder?: number;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDTO {
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateBrandDTO extends Partial<CreateBrandDTO> {}

export const brandApi = {
  getAll: async () => {
    const response = await apiClient.get<{ data: { data: Brand[]; total: number } }>('/brands');
    return response.data.data.data || [];
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Brand }>(`/brands/${id}`);
    return response.data.data;
  },
  
  create: async (data: CreateBrandDTO) => {
    const response = await apiClient.post<{ data: Brand }>('/brands', data);
    return response.data.data;
  },
  
  update: async (id: string, data: UpdateBrandDTO) => {
    const response = await apiClient.patch<{ data: Brand }>(`/brands/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/brands/${id}`);
    return response.data;
  }
};

import apiClient from '@/lib/axios';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

export const categoryApi = {
  getAll: async () => {
    const response = await apiClient.get<{ data: { data: Category[]; total: number } }>('/categories');
    return response.data.data.data || [];
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Category }>(`/categories/${id}`);
    return response.data.data;
  },
  
  create: async (data: CreateCategoryDTO) => {
    const response = await apiClient.post<{ data: Category }>('/categories', data);
    return response.data.data;
  },
  
  update: async (id: string, data: UpdateCategoryDTO) => {
    const response = await apiClient.patch<{ data: Category }>(`/categories/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  }
};

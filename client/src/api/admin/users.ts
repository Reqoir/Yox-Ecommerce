import apiClient from '@/lib/axios';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone?: string;
  profileImage?: string;
  permissions?: string[];
  roleName?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  status?: string;
  userType?: 'customer' | 'staff';
  includeDeleted?: boolean;
  deletedOnly?: boolean;
}

export interface UsersResponse {
  users: User[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const userApi = {
  getUsers: async (params?: GetUsersParams): Promise<UsersResponse> => {
    const response = await apiClient.get<{ data: User[]; meta: any }>('/users', { params });
    return {
      users: response.data.data || [],
      meta: response.data.meta || { currentPage: 1, totalPages: 1, totalItems: response.data.data?.length || 0, itemsPerPage: 10 },
    };
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<{ data: User }>(`/users/${userId}`);
    return response.data.data;
  },

  updateRole: async (
    userId: string,
    roleId: string,
    data?: { email?: string; password?: string }
  ): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/users/${userId}/role`, {
      roleId,
      ...data,
    });
    return response.data.data;
  },

  resetPassword: async (userId: string, password: string): Promise<void> => {
    await apiClient.patch(`/users/${userId}/password`, { password });
  },

  updateStatus: async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/users/${userId}/status`, { status });
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },

  createUser: async (data: { fullName: string; email: string; password?: string; phone?: string; roleId: string }): Promise<User> => {
    const response = await apiClient.post<{ data: User }>('/users', data);
    return response.data.data;
  },

  updateStaff: async (
    userId: string,
    data: { fullName?: string; email?: string; phone?: string; roleId?: string }
  ): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/users/${userId}/staff`, data);
    return response.data.data;
  },
};


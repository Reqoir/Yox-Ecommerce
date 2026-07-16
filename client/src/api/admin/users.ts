import apiClient from '../lib/axios';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  createdAt: string;
}

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<{ data: User[] }>('/users');
    return response.data.data;
  },

  updateRole: async (userId: string, roleId: string): Promise<User> => {
    const response = await apiClient.patch<{ data: User }>(`/users/${userId}/role`, { roleId });
    return response.data.data;
  },
};

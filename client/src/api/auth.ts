import apiClient from '../lib/axios';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    // The backend login endpoint returns: { status: 'success', data: { user: {...} }, message: '...' }
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', credentials);
    return response.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

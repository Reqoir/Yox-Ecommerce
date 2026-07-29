import apiClient from '../lib/axios';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  permissions: string[];
  phone?: string;
  avatar?: string;
  status?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<User> => {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', credentials);
    return response.data.data.user;
  },
  login: async (credentials: LoginCredentials): Promise<User> => {
    // The backend login endpoint returns: { status: 'success', data: { user: {...} }, message: '...' }
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', credentials);
    return response.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

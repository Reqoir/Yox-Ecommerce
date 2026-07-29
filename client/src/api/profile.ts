import api from './axios';
import { User } from '@/store/useAuthStore';

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileDto): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data.data;
  },
};

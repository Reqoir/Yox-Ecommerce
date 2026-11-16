import api from '../lib/axios';
import { User } from '@/store/useAuthStore';

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  verificationToken?: string;
}

export interface AdminPhoneChangeInitiateResponse {
  sessionId: string;
  maskedCurrentPhone: string;
  step: 'VERIFY_CURRENT_PHONE';
  expiresInSeconds: number;
  cooldownSeconds: number;
}

export interface AdminPhoneChangeVerifyCurrentResponse {
  success: boolean;
  step: 'ENTER_NEW_PHONE';
  message: string;
}

export interface AdminPhoneChangeRequestNewResponse {
  success: boolean;
  step: 'VERIFY_NEW_PHONE';
  maskedNewPhone: string;
  cooldownSeconds: number;
}

export interface AdminPhoneChangeVerifyNewResponse {
  success: boolean;
  message: string;
  phone: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AdminPhoneRecoveryInfoResponse {
  allowed: boolean;
  policy: string;
  steps: string[];
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileDto): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data.data;
  },

  initiateAdminPhoneChange: async (password: string): Promise<AdminPhoneChangeInitiateResponse> => {
    const response = await api.post('/users/admin-phone-change/initiate', { password });
    return response.data.data;
  },

  verifyCurrentAdminPhone: async (
    sessionId: string,
    verificationToken: string
  ): Promise<AdminPhoneChangeVerifyCurrentResponse> => {
    const response = await api.post('/users/admin-phone-change/verify-current-phone', {
      sessionId,
      verificationToken,
    });
    return response.data.data;
  },

  requestNewAdminPhone: async (
    sessionId: string,
    newPhone: string
  ): Promise<AdminPhoneChangeRequestNewResponse> => {
    const response = await api.post('/users/admin-phone-change/request-new-phone', {
      sessionId,
      newPhone,
    });
    return response.data.data;
  },

  verifyNewAdminPhone: async (
    sessionId: string,
    verificationToken: string
  ): Promise<AdminPhoneChangeVerifyNewResponse> => {
    const response = await api.post('/users/admin-phone-change/verify-new-phone', {
      sessionId,
      verificationToken,
    });
    return response.data.data;
  },

  cancelAdminPhoneChange: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/users/admin-phone-change/cancel', { sessionId });
    return response.data.data;
  },

  getAdminPhoneRecoveryInfo: async (): Promise<AdminPhoneRecoveryInfoResponse> => {
    const response = await api.get('/users/admin-phone-change/recovery-info');
    return response.data.data;
  },
};

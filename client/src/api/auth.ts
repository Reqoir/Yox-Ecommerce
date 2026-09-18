import apiClient from '../lib/axios';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  role?: string;
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

export interface LoginPhoneCredentials {
  phone: string;
  verificationToken: string;
}

export interface CandidateAccount {
  id: string;
  fullName: string;
  email: string | null;
  maskedEmail?: string;
  createdAt?: string;
}

export interface LoginPhoneResponse {
  multipleAccounts?: boolean;
  selectionToken?: string;
  accounts?: CandidateAccount[];
  user?: User;
}

export interface SelectPhoneAccountCredentials {
  selectionToken: string;
  userId: string;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterCredentials {
  fullName: string;
  password: string;
  email?: string;
  phone?: string;
  verificationToken?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ResetPasswordPhoneVerifyData {
  phone: string;
  verificationToken: string;
}

export interface ResetPasswordPhoneVerifyResponse {
  multipleAccounts: boolean;
  resetToken: string;
  accounts?: CandidateAccount[];
  user?: CandidateAccount;
}

export interface ResetPasswordPhoneConfirmData {
  resetToken: string;
  userId: string;
  newPassword: string;
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
  loginWithPhone: async (credentials: LoginPhoneCredentials): Promise<LoginPhoneResponse> => {
    const response = await apiClient.post<{ data: LoginPhoneResponse }>('/auth/login-phone', credentials);
    return response.data.data;
  },
  selectPhoneAccount: async (credentials: SelectPhoneAccountCredentials): Promise<User> => {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login-phone-select', credentials);
    return response.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{ data: AuthResponse }>('/auth/me');
    return response.data.data.user;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (password: string, token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { password, token });
    return response.data;
  },

  verifyResetPasswordPhone: async (data: ResetPasswordPhoneVerifyData): Promise<ResetPasswordPhoneVerifyResponse> => {
    const response = await apiClient.post<{ data: ResetPasswordPhoneVerifyResponse }>('/auth/reset-password-phone-verify', data);
    return response.data.data;
  },

  confirmResetPasswordPhone: async (data: ResetPasswordPhoneConfirmData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password-phone-confirm', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },
};


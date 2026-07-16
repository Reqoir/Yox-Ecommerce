/**
 * @file axios.ts
 * @description Centralised Axios instance with request/response interceptors.
 *
 * All API calls in the application must use this instance — never create
 * ad-hoc axios instances in components.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Send cookies for auth
});

// ── Request Interceptor ────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Access token will be attached here by the auth layer
    // const token = useAuthStore.getState().accessToken;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ── Response Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Log backend validation errors for easier debugging
    if (error.response?.data) {
      console.error('API Error Response:', error.response.data);
    }

    if (error.response?.status === 401) {
      // Import the store dynamically to avoid circular dependencies if any
      const { useAuthStore } = await import('../store/useAuthStore');
      
      // Only redirect if we are not already on a login page
      const currentPath = window.location.pathname;
      if (typeof window !== 'undefined' && !currentPath.includes('/login')) {
        useAuthStore.getState().logoutUser();
        
        // If they were in the admin section, send to admin-login
        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin-login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

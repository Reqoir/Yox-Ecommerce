/**
 * @file axios.ts
 * @description Centralised Axios instance with request/response interceptors.
 *
 * All API calls in the application must use this instance — never create
 * ad-hoc axios instances in components.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

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
    // Token refresh logic will be handled here when auth module is implemented
    // if (error.response?.status === 401) { ... refresh token ... }
    return Promise.reject(error);
  },
);

export default apiClient;

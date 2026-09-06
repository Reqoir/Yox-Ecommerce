/**
 * @file axios.ts
 * @description Centralised Axios instance with request/response interceptors.
 *
 * All API calls in the application must use this instance — never create
 * ad-hoc axios instances in components.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api/v1';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      try {
        const url = new URL(envUrl);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.hostname = host;
          return url.toString().replace(/\/$/, '');
        }
      } catch {}
    }
  }
  return envUrl;
};

export const API_BASE_URL = getApiBaseUrl();

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// ── Response Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const requestUrl = originalRequest?.url || '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/refresh');

    const statusCode = error.response?.status;

    // Suppress logging for:
    // 1. Normal 401s that will be handled by token refresh
    // 2. 400/422 validation errors (the caller handles these)
    // 3. Empty response bodies
    const shouldLog =
      error.response?.data &&
      Object.keys(error.response.data as object).length > 0 &&
      !(is401 && !originalRequest?._retry && !isAuthEndpoint) &&
      !(statusCode === 400 || statusCode === 422);

    if (shouldLog) {
      console.error('API Error Response:', error.response!.data);
    }

    if (is401 && originalRequest && !isAuthEndpoint) {
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token
          await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          
          processQueue(null, 'refreshed');
          isRefreshing = false;
          
          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError: any) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Refresh failed, clear session
          const { useAuthStore } = await import('../store/useAuthStore');
          useAuthStore.getState().logoutUser();

          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.includes('/login') || currentPath.includes('/admin-login');

            const isProtectedRoute =
              currentPath.startsWith('/profile') ||
              currentPath.startsWith('/checkout') ||
              currentPath.startsWith('/admin');

            if (isProtectedRoute && !isLoginPage) {
              if (currentPath.startsWith('/admin')) {
                window.location.href = '/admin-login';
              } else {
                window.location.href = '/login';
              }
            }
          }
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

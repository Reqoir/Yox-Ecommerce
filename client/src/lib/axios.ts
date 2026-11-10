/**
 * @file axios.ts
 * @description Centralised Axios instance with request/response interceptors.
 *
 * All API calls in the application must use this instance — never create
 * ad-hoc axios instances in components.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

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
    // If the request originates from or targets the admin dashboard,
    // attach the Admin Bearer token so admin actions are completely isolated
    // from any customer cookies present in the same browser.
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isAdminContext =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/admin-login') ||
        (typeof config.url === 'string' && (
          config.url.startsWith('/admin') ||
          config.url.startsWith('/staff') ||
          config.url.startsWith('/roles') ||
          config.url.startsWith('/reports') ||
          config.url.startsWith('/audit-logs')
        ));

      if (isAdminContext) {
        try {
          const raw = localStorage.getItem('admin-auth-storage');
          if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.state?.token;
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch {}
      }
    }
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
    const isClientError = Boolean(statusCode && statusCode >= 400 && statusCode < 500);

    // Suppress console.error overlay for expected client errors (4xx):
    // 1. 429 Rate Limit errors (handled cleanly by toast)
    // 2. Normal 401/403 authentication & authorization errors
    // 3. 400/422 validation errors (handled by forms/UI)
    // 4. 404/409 resource conflicts/not found
    const isRateLimit = statusCode === 429;

    const shouldLog =
      error.response?.data &&
      Object.keys(error.response.data as object).length > 0 &&
      !isClientError &&
      !(is401 && !originalRequest?._retry);

    if (shouldLog) {
      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} (${statusCode}):`, error.response?.data);
    } else if (process.env.NODE_ENV === 'development' && isClientError && !isRateLimit) {
      console.warn(`[API ${statusCode}] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`, error.response?.data);
    } else if (!error.response && error.message) {
      console.error(`[API Network Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`, error.message);
    }

    // ── 429 Rate Limit Handling ──────────────────────────────────────────────
    if (isRateLimit) {
      const responseData = error.response?.data as any;
      const message =
        responseData?.message ||
        responseData?.errors?.[0]?.message ||
        'Too many requests. Please slow down and try again shortly.';

      if (typeof window !== 'undefined') {
        // Use fixed toast id to avoid stacked duplicate toasts
        toast.error(message, { id: 'rate-limit-toast' });
      }
    }

    // Sanitize any raw backend refresh-token errors so they are never exposed to UI/toasts
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, any>;
      if (
        typeof data.message === 'string' &&
        (data.message.toLowerCase().includes('refresh token') ||
          data.message.toLowerCase().includes('token provided') ||
          data.message.toLowerCase().includes('no token'))
      ) {
        data.message = 'Please log in to continue.';
      }
    }

    if (is401) {
      const responseData = error.response?.data as any;
      const errorMsg = String(responseData?.message || error.message || '').toLowerCase();
      const isSuspendedError =
        errorMsg.includes('suspended') ||
        errorMsg.includes('deactivated') ||
        errorMsg.includes('revoked');

      // If account was suspended/deactivated, immediately logout and redirect to login with notification flag
      if (isSuspendedError) {
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isLoginPage = currentPath.includes('/login') || currentPath.includes('/admin-login');

          sessionStorage.setItem('yox_admin_logout_reason', 'suspended');
          sessionStorage.setItem(
            'yox_admin_logout_message',
            responseData?.message || 'Your staff account has been suspended by the administrator. Access revoked.'
          );

          if (currentPath.startsWith('/admin')) {
            const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
            useAdminAuthStore.getState().logoutUser();
            if (!isLoginPage) {
              window.location.href = '/admin-login?suspended=true';
            }
          } else {
            const { useAuthStore } = await import('../store/useAuthStore');
            useAuthStore.getState().logoutUser();
            if (!isLoginPage) {
              window.location.href = '/login?suspended=true';
            }
          }
        }
        return Promise.reject(error);
      }
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

        // Only attempt /auth/refresh if the user previously had an authenticated session
        let hasActiveSession = false;
        if (typeof window !== 'undefined') {
          try {
            const userStorage = localStorage.getItem('auth-storage');
            const adminStorage = localStorage.getItem('admin-auth-storage');
            const userAuth = userStorage ? JSON.parse(userStorage)?.state?.isAuthenticated : false;
            const adminAuth = adminStorage ? JSON.parse(adminStorage)?.state?.isAuthenticated : false;
            hasActiveSession = Boolean(userAuth || adminAuth);
          } catch {}
        }

        // If user is a guest, do not attempt to refresh tokens (guest has no refresh token)
        if (!hasActiveSession) {
          return Promise.reject(error);
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
          // Sanitize refresh error so "No refresh token provided" is never exposed
          if (refreshError.response?.data && typeof refreshError.response.data === 'object') {
            const data = refreshError.response.data as Record<string, any>;
            if (
              typeof data.message === 'string' &&
              (data.message.toLowerCase().includes('refresh token') ||
                data.message.toLowerCase().includes('token provided'))
            ) {
              data.message = 'Session expired. Please log in again.';
            }
          }

          processQueue(error, null);
          isRefreshing = false;
          
          const refreshMsg = String(refreshError.response?.data?.message || refreshError.message || '').toLowerCase();
          const isSuspendedInRefresh =
            refreshMsg.includes('suspended') ||
            refreshMsg.includes('deactivated') ||
            refreshMsg.includes('revoked');

          // Refresh failed, clear session
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isLoginPage = currentPath.includes('/login') || currentPath.includes('/admin-login');

            if (isSuspendedInRefresh) {
              sessionStorage.setItem('yox_admin_logout_reason', 'suspended');
              sessionStorage.setItem(
                'yox_admin_logout_message',
                refreshError.response?.data?.message || 'Your staff account has been suspended by the administrator.'
              );
            }

            if (currentPath.startsWith('/admin')) {
              const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
              useAdminAuthStore.getState().logoutUser();
              if (!isLoginPage) {
                window.location.href = isSuspendedInRefresh ? '/admin-login?suspended=true' : '/admin-login';
              }
            } else {
              const { useAuthStore } = await import('../store/useAuthStore');
              useAuthStore.getState().logoutUser();
              const isProtectedRoute =
                currentPath.startsWith('/profile') ||
                currentPath.startsWith('/checkout');
              if (isProtectedRoute && !isLoginPage) {
                window.location.href = isSuspendedInRefresh ? '/login?suspended=true' : '/login';
              }
            }
          } else {
            const { useAuthStore } = await import('../store/useAuthStore');
            useAuthStore.getState().logoutUser();
          }
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

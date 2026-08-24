'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    // Only run this once on mount
    if (initRef.current) return;
    initRef.current = true;

    // If Zustand thinks we are authenticated, verify with the backend
    // to ensure the cookie hasn't expired and to get fresh user data
    if (isAuthenticated) {
      authApi.getMe()
        .then((user) => {
          setUser(user);
        })
        .catch((error) => {
          // If we get 401, the interceptor will try to refresh. 
          // If refresh fails, it will log us out automatically.
          // We can also just be safe here
          if (error?.response?.status === 401) {
             // Let the interceptor handle it
          }
        });
    }
  }, [isAuthenticated, setUser, logout]);

  return <>{children}</>;
}

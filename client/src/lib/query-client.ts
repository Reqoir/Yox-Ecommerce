/**
 * @file query-client.ts
 * @description TanStack Query client configuration.
 * Default retry, stale time, and error handling settings.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 60 seconds before refetching
      staleTime: 60 * 1000,
      // Cache data for 5 minutes after it becomes inactive
      gcTime: 5 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    },
    mutations: {
      retry: 0,
    },
  },
});

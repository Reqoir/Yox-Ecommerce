"use client";

import { useEffect, useRef, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  rootMargin?: string;
  threshold?: number | number[];
  disabled?: boolean;
}

/**
 * Modern IntersectionObserver-based hook for smooth infinite scrolling and progressive loading.
 * Triggers `onLoadMore` when the sentinel element enters the viewport with customizable rootMargin.
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = '300px',
  threshold = 0.05,
  disabled = false,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingLockRef = useRef(false);

  // Keep latest callback reference
  const loadMoreCallbackRef = useRef(onLoadMore);
  useEffect(() => {
    loadMoreCallbackRef.current = onLoadMore;
  }, [onLoadMore]);

  const triggerLoad = useCallback(() => {
    if (!hasMore || isLoading || loadingLockRef.current || disabled) {
      return;
    }

    loadingLockRef.current = true;
    try {
      const result = loadMoreCallbackRef.current();
      if (result && typeof (result as any).then === 'function') {
        (result as Promise<void>).finally(() => {
          // Add brief delay to prevent rapid micro-triggers
          setTimeout(() => {
            loadingLockRef.current = false;
          }, 150);
        });
      } else {
        setTimeout(() => {
          loadingLockRef.current = false;
        }, 150);
      }
    } catch {
      loadingLockRef.current = false;
    }
  }, [hasMore, isLoading, disabled]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || disabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          triggerLoad();
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, rootMargin, threshold, disabled, triggerLoad]);

  return {
    sentinelRef,
    triggerLoad,
  };
}

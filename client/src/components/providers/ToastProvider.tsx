'use client';

/**
 * @file ToastProvider.tsx
 * @description Sonner toast provider for in-app notifications.
 * Use the `toast` helper from 'sonner' directly in any component or hook.
 */

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        duration: 4000,
        classNames: {
          error: 'bg-destructive text-destructive-foreground',
          success: 'bg-green-500 text-white',
        },
      }}
    />
  );
}

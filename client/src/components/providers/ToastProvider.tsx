'use client';

/**
 * @file ToastProvider.tsx
 * @description Shadcn Sonner toast provider for in-app notifications.
 * Use the `toast` helper from 'sonner' directly in any component or hook.
 */

import { Toaster } from '@/components/ui/sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      closeButton
      duration={3500}
      offset="16px"
    />
  );
}

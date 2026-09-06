'use client';

import { useRealtimeNotifications } from '@/hooks/admin/useRealtimeNotifications';

/**
 * Mounts the real-time SSE notification listener for the admin panel.
 * Renders nothing visible — purely a side-effect component.
 */
export function RealtimeNotificationsProvider() {
  useRealtimeNotifications();
  return null;
}

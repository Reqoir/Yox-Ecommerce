'use client';

/**
 * @file useRealtimeNotifications.ts
 * @description Hook that subscribes to the SSE /api/v1/notifications/stream endpoint.
 *
 * On every incoming notification:
 *  1. Plays a bell chime (Web Audio API)
 *  2. Shows a SweetAlert2 popup with details (title, message, action button)
 *  3. Invalidates TanStack Query caches for 'notifications' and 'orders' so the UI refreshes instantly
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification, notificationApi } from '@/api/admin/notifications';
import { getApiBaseUrl } from '@/lib/axios';

interface RealtimeNotification {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST' | 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM' | 'NEW_REVIEW' | 'NEW_USER';
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  isRead: boolean;
}

const TYPE_CONFIG = {
  NEW_ORDER: {
    icon: '🛒',
    color: '#10b981',
    confirmText: 'View Orders',
    href: '/admin/order',
    bgColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  ORDER_CANCELLED: {
    icon: '❌',
    color: '#ef4444',
    confirmText: 'View Order',
    href: '/admin/order',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  RETURN_REQUEST: {
    icon: '📦',
    color: '#f59e0b',
    confirmText: 'View Returns',
    href: '/admin/order?tab=returns',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  LOW_STOCK: {
    icon: '⚠️',
    color: '#f59e0b',
    confirmText: 'View Inventory',
    href: '/admin/inventory',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  ORDER_STATUS: {
    icon: '📋',
    color: '#3b82f6',
    confirmText: 'View Orders',
    href: '/admin/order',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  SYSTEM: {
    icon: 'ℹ️',
    color: '#6b7280',
    confirmText: 'OK',
    href: null,
    bgColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  NEW_REVIEW: {
    icon: '⭐',
    color: '#8b5cf6',
    confirmText: 'View Reviews',
    href: '/admin/reviews',
    bgColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  NEW_USER: {
    icon: '👤',
    color: '#06b6d4',
    confirmText: 'View Customers',
    href: '/admin/user',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
  },
};

const NOTIFICATION_PERMISSION_MAP: Record<string, string> = {
  NEW_ORDER: 'manage_orders',
  ORDER_CANCELLED: 'manage_orders',
  ORDER_STATUS: 'manage_orders',
  RETURN_REQUEST: 'manage_orders',
  LOW_STOCK: 'manage_inventory',
  NEW_REVIEW: 'manage_reviews',
  NEW_USER: 'manage_users',
};

function hasNotificationPermission(notificationType: string, permissions: string[], role?: string): boolean {
  const roleUpper = String(role || '').toUpperCase();
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN' || roleUpper.includes('ADMIN')) return true;
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*') || permissions.includes('manage_notifications')) return true;

  const required = NOTIFICATION_PERMISSION_MAP[notificationType];
  if (!required) {
    return permissions.length > 0;
  }
  return permissions.includes(required);
}

/**
 * Checks whether the current user is an admin/staff member who should receive
 * real-time notifications. Any non-empty permissions array means the user has a role.
 */
function isAdminUser(permissions: string[], role?: string): boolean {
  const roleUpper = String(role || '').toUpperCase();
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN' || roleUpper.includes('ADMIN')) return true;
  if (!permissions || permissions.length === 0) return false;
  return true;
}

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(3000); // Start at 3s, back off
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Close any existing connection first
    if (eventSourceRef.current) {
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (!isAuthenticated || !user) return;

    const permissions = user.permissions || [];
    const userRole = (user as any)?.role || (user as any)?.roleId;
    if (!isAdminUser(permissions, userRole)) return;

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.onerror = null;
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      console.debug('[SSE] Connecting to notification stream...');

      const apiBase = getApiBaseUrl();
      const es = new EventSource(`${apiBase}/notifications/stream`, {
        withCredentials: true,
      });
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        console.debug('[SSE] ✅ Real-time notifications connected');
        reconnectDelayRef.current = 3000; // Reset backoff on success
      });

      es.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification: RealtimeNotification = JSON.parse(event.data);
          console.debug('[SSE] 🔔 Notification received:', notification.type, notification.title);
          handleNotification(notification);
        } catch {
          console.warn('[SSE] Failed to parse notification event');
        }
      });

      es.onerror = () => {
        // If unmounted or closed, do not trigger reconnect loop
        if (!isMounted) return;

        // Cleanly detach handler before closing to prevent secondary error event
        es.onerror = null;
        es.close();
        eventSourceRef.current = null;

        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 30000);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect();
          }
        }, delay);
      };
    };

    const handleNotification = (notification: RealtimeNotification) => {
      if (seenNotificationIdsRef.current.has(notification.id)) return;
      seenNotificationIdsRef.current.add(notification.id);

      // Verify caller permission for this notification type
      const userPermissions = user?.permissions || [];
      const userRole = (user as any)?.role || (user as any)?.roleId;
      if (!hasNotificationPermission(notification.type, userPermissions, userRole)) {
        return;
      }

      // 1. Synchronously update ALL TanStack Query notification caches
      //    This makes the sidebar badge AND notification page list update
      //    at the exact same instant in the same React render tick!
      const queries = queryClient.getQueriesData<{ data: Notification[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });

      const isUnread = !(notification.isRead ?? false);
      const newItem: Notification = {
        id: notification.id,
        userId: null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead ?? false,
        metadata: notification.metadata ?? null,
        createdAt: notification.createdAt || new Date().toISOString(),
        updatedAt: notification.createdAt || new Date().toISOString(),
      };

      if (queries.length === 0) {
        queryClient.setQueryData(['notifications', 'list'], {
          data: [newItem],
          total: 1,
          unreadCount: isUnread ? 1 : 0,
        });
      } else {
        for (const [key, old] of queries) {
          if (!old) continue;
          const filter = (key[2] as { type?: string; isRead?: string } | undefined) || {};
          const matchesType = !filter.type || filter.type === notification.type;
          const matchesRead = !filter.isRead || (filter.isRead === 'false' && isUnread);

          const existingList = old.data || [];
          if (existingList.some((item) => item.id === notification.id)) continue;

          queryClient.setQueryData(key, {
            ...old,
            total: matchesType && matchesRead ? (old.total || 0) + 1 : old.total,
            unreadCount: (old.unreadCount || 0) + (isUnread ? 1 : 0),
            data: matchesType && matchesRead ? [newItem, ...existingList] : existingList,
          });
        }
      }

      // 3. Background refetch to ensure database consistency
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });

      // 3b. Dispatch window event so non-React-Query pages refresh immediately
      if (typeof window !== 'undefined') {
        const meta = notification.metadata as any;
        if (
          notification.type === 'NEW_ORDER' ||
          notification.type === 'ORDER_CANCELLED' ||
          notification.type === 'ORDER_STATUS' ||
          notification.type === 'RETURN_REQUEST'
        ) {
          window.dispatchEvent(
            new CustomEvent('admin:order-updated', {
              detail: {
                type: notification.type,
                metadata: meta,
                orderId: meta?.orderNumber || meta?.orderId,
                returnId: meta?.returnId,
              },
            })
          );
        } else if (notification.type === 'NEW_REVIEW') {
          window.dispatchEvent(
            new CustomEvent('admin:review-updated', {
              detail: {
                type: notification.type,
                metadata: meta,
                reviewId: meta?.reviewId,
              },
            })
          );
        } else if (notification.type === 'NEW_USER') {
          window.dispatchEvent(
            new CustomEvent('admin:user-updated', {
              detail: {
                type: notification.type,
                metadata: meta,
                userId: meta?.userId,
              },
            })
          );
        }
      }

      // 4. Show SweetAlert2 popup
      const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;
      const orderNumber = notification.metadata?.orderNumber as string | undefined;
      const customerNote = notification.metadata?.customerNote as string | undefined;
      const totalAmount = notification.metadata?.totalAmount as number | undefined;
      const quantity = notification.metadata?.quantity as number | undefined;

      let extraHtml = '';
      if (orderNumber) {
        extraHtml += `<div style="display:inline-block;padding:2px 10px;background:${config.borderColor}33;border-radius:6px;font-weight:700;font-size:13px;margin-bottom:8px;">Order #${orderNumber}</div>`;
      }
      if (totalAmount !== undefined) {
        extraHtml += `<div style="font-size:14px;font-weight:600;color:${config.color};margin-bottom:4px;">₹${Number(totalAmount).toLocaleString('en-IN')}</div>`;
      }
      if (quantity !== undefined && notification.type === 'RETURN_REQUEST') {
        extraHtml += `<div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Qty: ${quantity} unit${Number(quantity) !== 1 ? 's' : ''}</div>`;
      }
      if (customerNote) {
        extraHtml += `<div style="margin-top:8px;padding:8px 12px;background:#f8fafc;border-left:3px solid ${config.color};border-radius:4px;text-align:left;font-size:13px;color:#374151;font-style:italic;">"${customerNote}"</div>`;
      }
      if (notification.type === 'NEW_REVIEW') {
        const rating = notification.metadata?.rating as number | undefined;
        const productName = notification.metadata?.productName as string | undefined;
        if (rating) {
          extraHtml += `<div style="font-size:15px;font-weight:700;color:#8b5cf6;margin-bottom:4px;">${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))} (${rating}/5)</div>`;
        }
        if (productName) {
          extraHtml += `<div style="display:inline-block;padding:2px 10px;background:#8b5cf622;border-radius:6px;font-weight:600;font-size:12px;margin-bottom:8px;color:#6d28d9;">${productName}</div>`;
        }
      }
      if (notification.type === 'NEW_USER') {
        const email = notification.metadata?.email as string | undefined;
        if (email) {
          extraHtml += `<div style="display:inline-block;padding:2px 10px;background:#06b6d422;border-radius:6px;font-weight:600;font-size:12px;margin-bottom:8px;color:#0891b2;">${email}</div>`;
        }
      }

      let targetHref = config.href;
      let confirmText = config.confirmText;
      const orderId = notification.metadata?.orderId as string | undefined;
      const returnId = notification.metadata?.returnId as string | undefined;

      if (notification.type === 'RETURN_REQUEST') {
        const queryParts = ['tab=returns'];
        if (returnId) queryParts.push(`returnId=${encodeURIComponent(returnId)}`);
        if (orderNumber) queryParts.push(`orderId=${encodeURIComponent(orderNumber)}`);
        else if (orderId) queryParts.push(`orderId=${encodeURIComponent(orderId)}`);
        targetHref = `/admin/order?${queryParts.join('&')}`;
        confirmText = orderNumber ? `View Return #${orderNumber}` : 'View Return';
      } else if (
        notification.type === 'NEW_ORDER' ||
        notification.type === 'ORDER_CANCELLED' ||
        notification.type === 'ORDER_STATUS'
      ) {
        const orderKey = orderNumber || orderId;
        if (orderKey) {
          targetHref = `/admin/order?orderId=${encodeURIComponent(orderKey)}`;
          confirmText = `View Order #${orderKey}`;
        }
      }

      void Swal.fire({
        title: `<span style="font-size:18px;font-weight:700;">${notification.title}</span>`,
        html: `
          <div style="text-align:center;">
            ${extraHtml}
            <p style="color:#4b5563;font-size:14px;margin:8px 0 0;">${notification.message}</p>
          </div>
        `,
        icon: undefined,
        iconHtml: `<span style="font-size:40px;line-height:1;">${config.icon}</span>`,
        confirmButtonText: confirmText,
        showCancelButton: targetHref !== null,
        cancelButtonText: 'Dismiss',
        confirmButtonColor: config.color,
        cancelButtonColor: '#9ca3af',
        background: config.bgColor,
        timer: 12000,
        timerProgressBar: true,
        position: 'top-end',
        width: '380px',
        padding: '16px',
      }).then((result) => {
        if (result.isConfirmed && targetHref) {
          router.push(targetHref);
        }
      });
    };

    // Seed already existing notifications on initial mount so we don't show popups for old ones
    notificationApi
      .getAll({ limit: 10 })
      .then((res) => {
        if (res?.data) {
          for (const n of res.data) {
            seenNotificationIdsRef.current.add(n.id);
          }
        }
      })
      .catch(() => {});

    connect();

    // Periodic safety check for new unread notifications across devices/servers
    const syncInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await notificationApi.getAll({ limit: 5 });
        if (res?.data && res.data.length > 0) {
          for (const item of res.data) {
            if (!seenNotificationIdsRef.current.has(item.id) && !item.isRead) {
              const ageMs = Date.now() - new Date(item.createdAt).getTime();
              if (ageMs < 120_000) {
                console.debug('[Realtime] New notification detected from poll:', item.type, item.title);
                handleNotification(item as unknown as RealtimeNotification);
              } else {
                seenNotificationIdsRef.current.add(item.id);
              }
            }
          }
        }
      } catch {}
    }, 4_000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.onerror = null;
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]);
  // NOTE: using user?.id (not user object) to avoid re-connecting on every render
}

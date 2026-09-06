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
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/useAuthStore';
import { playNotificationChime } from '@/lib/audio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api/v1';

interface RealtimeNotification {
  id: string;
  type: 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST' | 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';
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
    href: '/admin/order',
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
};

/**
 * Checks whether the current user is an admin/staff member who should receive
 * real-time notifications. Any non-empty permissions array means the user has a role.
 */
function isAdminUser(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false;
  // If they have ANY of these permissions, they're at least staff
  const adminPerms = [
    'manage_orders',
    'manage_users',
    'manage_products',
    'manage_inventory',
    'view_analytics',
    'manage_staff',
    'manage_roles',
    'manage_settings',
    'view_orders',
  ];
  return adminPerms.some(p => permissions.includes(p));
}

export function useRealtimeNotifications() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(3000); // Start at 3s, back off

  useEffect(() => {
    // Close any existing connection first
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (!isAuthenticated || !user) return;

    const permissions = user.permissions || [];
    if (!isAdminUser(permissions)) return;

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.debug('[SSE] Connecting to notification stream...');

      const es = new EventSource(`${API_BASE_URL}/notifications/stream`, {
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

      es.onerror = (err) => {
        console.warn('[SSE] Connection error — will reconnect in', reconnectDelayRef.current, 'ms');
        es.close();
        eventSourceRef.current = null;

        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              // Exponential backoff capped at 30s
              reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 30000);
              connect();
            }
          }, reconnectDelayRef.current);
        }
      };
    };

    const handleNotification = (notification: RealtimeNotification) => {
      // 1. Play chime
      playNotificationChime();

      // 2. Invalidate queries immediately so UI updates
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      // 3. Show SweetAlert2 popup
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
        confirmButtonText: config.confirmText,
        showCancelButton: config.href !== null,
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
        if (result.isConfirmed && config.href) {
          window.location.href = config.href;
        }
      });
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, queryClient]);
  // NOTE: using user?.id (not user object) to avoid re-connecting on every render
}

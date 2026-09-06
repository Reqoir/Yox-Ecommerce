'use client';

import { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCheck,
  Trash2,
  Loader2,
  Package,
  ShoppingCart,
  Info,
  ShoppingBag,
  XCircle,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { Notification } from '@/api/admin/notifications';
import { playNotificationChime } from '@/lib/audio';
import Link from 'next/link';

type TypeFilter = 'all' | 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM' | 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST';

const TYPE_CONFIG: Record<
  Notification['type'],
  { label: string; icon: React.ElementType; badge: string; bg: string; emoji: string }
> = {
  LOW_STOCK: {
    label: 'Low Stock',
    icon: AlertTriangle,
    badge: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    bg: 'border-l-rose-500',
    emoji: '⚠️',
  },
  ORDER_STATUS: {
    label: 'Order Update',
    icon: ShoppingCart,
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    bg: 'border-l-blue-500',
    emoji: '📋',
  },
  SYSTEM: {
    label: 'System',
    icon: Info,
    badge: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
    bg: 'border-l-slate-400',
    emoji: 'ℹ️',
  },
  NEW_ORDER: {
    label: 'New Order',
    icon: ShoppingBag,
    badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    bg: 'border-l-emerald-500',
    emoji: '🛒',
  },
  ORDER_CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    badge: 'bg-red-500/15 text-red-600 border-red-500/30',
    bg: 'border-l-red-500',
    emoji: '❌',
  },
  RETURN_REQUEST: {
    label: 'Return Request',
    icon: RotateCcw,
    badge: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    bg: 'border-l-amber-500',
    emoji: '📦',
  },
};

const FILTER_TABS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'NEW_ORDER', label: '🛒 Orders' },
  { key: 'ORDER_CANCELLED', label: '❌ Cancelled' },
  { key: 'RETURN_REQUEST', label: '📦 Returns' },
  { key: 'LOW_STOCK', label: '⚠️ Low Stock' },
  { key: 'ORDER_STATUS', label: '📋 Status' },
  { key: 'SYSTEM', label: 'ℹ️ System' },
];

export default function AdminNotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');

  const { notifications, total, unreadCount, isLoading, markRead, markAllRead, isMarkingAllRead, deleteNotification } =
    useNotifications({
      type: typeFilter === 'all' ? undefined : typeFilter,
      isRead: readFilter === 'unread' ? 'false' : undefined,
    });

  const handleMarkRead = (n: Notification) => {
    if (!n.isRead) markRead(n.id);
  };

  const handleTestChime = () => {
    playNotificationChime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white text-sm px-2 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time alerts for new orders, cancellations, returns, and stock issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestChime}
            title="Test notification sound"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Test Sound
          </Button>
          <Button
            variant="outline"
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead || unreadCount === 0}
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={typeFilter === key ? 'default' : 'outline'}
              onClick={() => setTypeFilter(key)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant={readFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setReadFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={readFilter === 'unread' ? 'default' : 'outline'}
            onClick={() => setReadFilter('unread')}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-lg">No notifications</p>
          <p className="text-sm">
            {readFilter === 'unread' ? 'All caught up!' : "You'll be notified instantly about new orders, cancellations, and returns."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;
            const meta = n.metadata as any;

            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-l-4 border border-border/60 transition-all cursor-pointer ${
                  config.bg
                } ${n.isRead ? 'opacity-60 bg-muted/20' : 'bg-card shadow-sm hover:shadow-md'}`}
                onClick={() => handleMarkRead(n)}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <span className="absolute top-4 right-12 h-2 w-2 rounded-full bg-blue-500" />
                )}

                {/* Emoji + Icon */}
                <div className={`p-2 rounded-lg border ${config.badge} shrink-0 text-center`}>
                  <span className="text-lg leading-none">{config.emoji}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${!n.isRead ? '' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <Badge className={`${config.badge} border text-xs`}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>

                      {/* New Order metadata */}
                      {n.type === 'NEW_ORDER' && meta && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs rounded-md bg-emerald-500/10 px-3 py-2 w-fit">
                          {meta.orderNumber && (
                            <span>
                              <span className="text-muted-foreground">Order: </span>
                              <span className="font-semibold">#{String(meta.orderNumber)}</span>
                            </span>
                          )}
                          {meta.totalAmount !== undefined && (
                            <span>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-semibold text-emerald-600">
                                ₹{Number(meta.totalAmount).toLocaleString('en-IN')}
                              </span>
                            </span>
                          )}
                          {meta.itemCount !== undefined && (
                            <span>
                              <span className="text-muted-foreground">Items: </span>
                              <span className="font-semibold">{String(meta.itemCount)}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Cancelled order metadata */}
                      {n.type === 'ORDER_CANCELLED' && meta && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs rounded-md bg-red-500/10 px-3 py-2 w-fit">
                          {meta.orderNumber && (
                            <span>
                              <span className="text-muted-foreground">Order: </span>
                              <span className="font-semibold">#{String(meta.orderNumber)}</span>
                            </span>
                          )}
                          {meta.reason && (
                            <span>
                              <span className="text-muted-foreground">Reason: </span>
                              <span className="font-semibold">{String(meta.reason)}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Return request metadata + customer note */}
                      {n.type === 'RETURN_REQUEST' && meta && (
                        <div className="mt-2 space-y-1">
                          <div className="flex flex-wrap gap-3 text-xs rounded-md bg-amber-500/10 px-3 py-2 w-fit">
                            {meta.orderNumber && (
                              <span>
                                <span className="text-muted-foreground">Order: </span>
                                <span className="font-semibold">#{String(meta.orderNumber)}</span>
                              </span>
                            )}
                            {meta.quantity !== undefined && (
                              <span>
                                <span className="text-muted-foreground">Qty: </span>
                                <span className="font-semibold">{String(meta.quantity)} unit{Number(meta.quantity) !== 1 ? 's' : ''}</span>
                              </span>
                            )}
                            {meta.reason && (
                              <span>
                                <span className="text-muted-foreground">Reason: </span>
                                <span className="font-semibold">{String(meta.reason)}</span>
                              </span>
                            )}
                          </div>
                          {meta.customerNote && (
                            <div className="text-xs italic text-muted-foreground border-l-2 border-amber-400 pl-2 py-0.5 max-w-md">
                              "{String(meta.customerNote)}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Low stock metadata */}
                      {n.type === 'LOW_STOCK' && meta && (
                        <div className="mt-2 flex gap-4 text-xs rounded-md bg-rose-500/10 px-3 py-2 w-fit">
                          <span>
                            <span className="text-muted-foreground">Stock: </span>
                            <span className="font-semibold text-rose-600">{meta.currentStock}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Threshold: </span>
                            <span className="font-semibold">{meta.threshold}</span>
                          </span>
                          {meta.variantId && (
                            <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                              {String(meta.variantId)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action links */}
                      {(n.type === 'NEW_ORDER' || n.type === 'ORDER_CANCELLED') && (
                        <Link
                          href="/admin/order"
                          className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          View Orders →
                        </Link>
                      )}
                      {n.type === 'RETURN_REQUEST' && (
                        <Link
                          href="/admin/order"
                          className="mt-2 inline-block text-xs font-medium text-amber-600 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          View Returns →
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > notifications.length && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {notifications.length} of {total} notifications
        </p>
      )}
    </div>
  );
}

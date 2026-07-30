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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { Notification } from '@/api/admin/notifications';

type TypeFilter = 'all' | 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';

const TYPE_CONFIG: Record<
  'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM',
  { label: string; icon: React.ElementType; badge: string; bg: string }
> = {
  LOW_STOCK: {
    label: 'Low Stock',
    icon: AlertTriangle,
    badge: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    bg: 'border-l-rose-500',
  },
  ORDER_STATUS: {
    label: 'Order Status',
    icon: ShoppingCart,
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    bg: 'border-l-blue-500',
  },
  SYSTEM: {
    label: 'System',
    icon: Info,
    badge: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
    bg: 'border-l-slate-400',
  },
};

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            System alerts, low-stock warnings, and order updates
          </p>
        </div>
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {/* Type filters */}
        <div className="flex gap-2">
          {(['all', 'LOW_STOCK', 'ORDER_STATUS', 'SYSTEM'] as TypeFilter[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? 'default' : 'outline'}
              onClick={() => setTypeFilter(t)}
              className="capitalize"
            >
              {t === 'LOW_STOCK' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-400" />}
              {t === 'all' ? 'All Types' : TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label}
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
            {readFilter === 'unread' ? 'All caught up!' : "You'll be notified about low stock, orders, and system events."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type];
            const Icon = config.icon;

            // Extract metadata for LOW_STOCK display
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

                {/* Icon */}
                <div className={`p-2 rounded-lg border ${config.badge} shrink-0`}>
                  <Icon className="h-5 w-5" />
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

                      {/* Low stock metadata card */}
                      {n.type === 'LOW_STOCK' && meta && (
                        <div className="mt-2 flex gap-4 text-xs rounded-md bg-rose-500/10 px-3 py-2 w-fit">
                          <span>
                            <span className="text-muted-foreground">Stock: </span>
                            <span className="font-semibold text-rose-600">
                              {meta.currentStock}
                            </span>
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

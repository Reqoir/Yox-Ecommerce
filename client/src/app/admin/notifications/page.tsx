'use client';

import { useState, useMemo } from 'react';
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
  CheckSquare,
  Square,
  X,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/api/admin/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type TypeFilter = 'all' | 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM' | 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST' | 'NEW_REVIEW' | 'NEW_USER';

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
  NEW_REVIEW: {
    label: 'Customer Review',
    icon: MessageSquare,
    badge: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    bg: 'border-l-purple-500',
    emoji: '⭐',
  },
  NEW_USER: {
    label: 'New Customer',
    icon: Users,
    badge: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
    bg: 'border-l-cyan-500',
    emoji: '👤',
  },
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const userRole = (user as any)?.role || (user as any)?.roleId;
  const roleUpper = String(userRole || '').toUpperCase();
  const isAdmin =
    roleUpper === 'ADMIN' ||
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper.includes('ADMIN') ||
    userPermissions.includes('*') ||
    userPermissions.includes('manage_notifications');

  const visibleFilterTabs = useMemo(() => {
    const tabs: { key: TypeFilter; label: string }[] = [{ key: 'all', label: 'All' }];

    if (isAdmin || userPermissions.includes('manage_orders')) {
      tabs.push({ key: 'NEW_ORDER', label: '🛒 Orders' });
      tabs.push({ key: 'ORDER_CANCELLED', label: '❌ Cancelled' });
      tabs.push({ key: 'RETURN_REQUEST', label: '📦 Returns' });
      tabs.push({ key: 'ORDER_STATUS', label: '📋 Status' });
    }

    if (isAdmin || userPermissions.includes('manage_inventory')) {
      tabs.push({ key: 'LOW_STOCK', label: '⚠️ Low Stock' });
    }

    if (isAdmin || userPermissions.includes('manage_reviews')) {
      tabs.push({ key: 'NEW_REVIEW', label: '⭐ Reviews' });
    }

    if (isAdmin || userPermissions.includes('manage_users')) {
      tabs.push({ key: 'NEW_USER', label: '👥 Users' });
    }

    // System tab for everyone
    tabs.push({ key: 'SYSTEM', label: 'ℹ️ System' });

    return tabs;
  }, [isAdmin, userPermissions]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const emptyDescription = useMemo(() => {
    if (readFilter === 'unread') {
      return 'All caught up! No unread notifications.';
    }

    if (typeFilter !== 'all') {
      switch (typeFilter) {
        case 'NEW_ORDER':
          return "You'll be notified instantly when new customer orders are placed.";
        case 'ORDER_CANCELLED':
          return "You'll be notified instantly when orders are cancelled.";
        case 'RETURN_REQUEST':
          return "You'll be notified instantly when customer return requests are submitted.";
        case 'ORDER_STATUS':
          return "You'll be notified instantly about customer order status updates.";
        case 'LOW_STOCK':
          return "You'll be notified instantly when inventory levels fall below thresholds.";
        case 'NEW_REVIEW':
          return "You'll be notified instantly when new customer reviews are submitted.";
        case 'NEW_USER':
          return "You'll be notified instantly when new customers register.";
        case 'SYSTEM':
          return "You'll be notified instantly about system updates and announcements.";
        default:
          break;
      }
    }

    const topics: string[] = [];
    if (isAdmin || userPermissions.includes('manage_orders')) {
      topics.push('orders, cancellations, and returns');
    }
    if (isAdmin || userPermissions.includes('manage_inventory')) {
      topics.push('low stock alerts');
    }
    if (isAdmin || userPermissions.includes('manage_reviews')) {
      topics.push('new reviews');
    }
    if (isAdmin || userPermissions.includes('manage_users')) {
      topics.push('new customer registrations');
    }
    topics.push('system updates');

    if (topics.length === 1) {
      return `You'll be notified instantly about ${topics[0]}.`;
    }
    if (topics.length === 2) {
      return `You'll be notified instantly about ${topics[0]} and ${topics[1]}.`;
    }
    const copy = [...topics];
    const last = copy.pop();
    return `You'll be notified instantly about ${copy.join(', ')}, and ${last}.`;
  }, [readFilter, typeFilter, isAdmin, userPermissions]);

  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    isMarkingAllRead,
    markManyRead,
    isMarkingManyRead,
    deleteNotification,
    deleteManyNotifications,
    isDeletingMany,
    deleteAllNotifications,
    isDeletingAll,
  } = useNotifications({
    type: typeFilter === 'all' ? undefined : typeFilter,
    isRead: readFilter === 'unread' ? 'false' : undefined,
  });

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markRead(n.id);
    let meta = n.metadata as any;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {}
    }
    if (n.type === 'RETURN_REQUEST') {
      const query = ['tab=returns'];
      if (meta?.returnId) query.push(`returnId=${encodeURIComponent(String(meta.returnId))}`);
      if (meta?.orderNumber) query.push(`orderId=${encodeURIComponent(String(meta.orderNumber))}`);
      else if (meta?.orderId) query.push(`orderId=${encodeURIComponent(String(meta.orderId))}`);
      router.push(`/admin/order?${query.join('&')}`);
    } else if (n.type === 'NEW_ORDER' || n.type === 'ORDER_CANCELLED' || n.type === 'ORDER_STATUS') {
      let orderKey = meta?.orderNumber || meta?.orderId;
      if (!orderKey && n.message) {
        const match = n.message.match(/#(YOX-[A-Za-z0-9-]+)/i);
        if (match) orderKey = match[1];
      }
      if (orderKey) {
        const cleanKey = String(orderKey).replace(/^#/, '');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('admin:open-order', { detail: { orderId: cleanKey } }));
        }
        router.push(`/admin/order?orderId=${encodeURIComponent(cleanKey)}`);
      } else {
        router.push('/admin/order');
      }
    } else if (n.type === 'LOW_STOCK') {
      router.push('/admin/inventory');
    } else if (n.type === 'NEW_REVIEW') {
      router.push('/admin/reviews');
    } else if (n.type === 'NEW_USER') {
      router.push('/admin/user');
    }
  };

  const handleCardClick = (n: Notification) => {
    if (isSelectionMode) {
      toggleSelect(n.id);
    } else {
      handleNotificationClick(n);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleMarkSelectedRead = () => {
    if (selectedIds.length === 0) return;
    markManyRead(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
      },
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const count = selectedIds.length;
    const result = await Swal.fire({
      title: `Delete ${count} Notification${count > 1 ? 's' : ''}?`,
      text: `Are you sure you want to delete ${count} selected notification${count > 1 ? 's' : ''}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      deleteManyNotifications(selectedIds, {
        onSuccess: () => setSelectedIds([]),
      });
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    const result = await Swal.fire({
      title: 'Delete All Notifications?',
      text: 'This will permanently delete all your notifications. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      deleteAllNotifications(undefined, {
        onSuccess: () => {
          setSelectedIds([]);
          setIsSelectionMode(false);
        },
      });
    }
  };

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white text-sm px-2 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time alerts and activity updates tailored to your role
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isSelectionMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              if (isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedIds([]);
              } else {
                setIsSelectionMode(true);
              }
            }}
            disabled={notifications.length === 0}
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
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
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
            onClick={handleDeleteAll}
            disabled={isDeletingAll || notifications.length === 0}
          >
            {isDeletingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete All
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4 w-full">
        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {visibleFilterTabs.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={typeFilter === key ? 'default' : 'outline'}
              onClick={() => {
                setTypeFilter(key);
                setSelectedIds([]);
              }}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            size="sm"
            variant={readFilter === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setReadFilter('all');
              setSelectedIds([]);
            }}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={readFilter === 'unread' ? 'default' : 'outline'}
            onClick={() => {
              setReadFilter('unread');
              setSelectedIds([]);
            }}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Selection Mode Action Bar */}
      {isSelectionMode && notifications.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 p-3 rounded-xl border border-primary/20 flex-wrap gap-3 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs font-medium"
            >
              {isAllSelected ? (
                <>
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Select Whole ({notifications.length})
                </>
              )}
            </Button>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
              {selectedIds.length} of {notifications.length} selected
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mark Selected as Read */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkSelectedRead}
              disabled={selectedIds.length === 0 || isMarkingManyRead}
              className="h-8 text-xs font-medium"
            >
              {isMarkingManyRead ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              )}
              Mark as read {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>

            {/* Delete Selected */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isDeletingMany}
              className="h-8 text-xs font-medium"
            >
              {isDeletingMany ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Delete selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>

            {/* Done button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Notification List */}
      {isLoading ? (
                <div className="p-6 md:p-8 space-y-6 w-full animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-xl" />
            <div className="h-8 w-48 bg-muted rounded-md" />
          </div>
          <div className="h-24 w-full bg-muted rounded-xl" />
          <div className="h-[400px] w-full bg-muted rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-lg">No notifications</p>
          <p className="text-sm text-center max-w-md">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;
            const meta = n.metadata as any;
            const isSelected = selectedIds.includes(n.id);

            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-3 p-4 rounded-xl border-l-4 border transition-all cursor-pointer ${
                  config.bg
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/[0.04]'
                    : 'border-border/60'
                } ${
                  n.isRead && !isSelected ? 'bg-muted/20 border-border/40 hover:bg-muted/40' : !isSelected ? 'bg-card shadow-sm hover:shadow-md' : ''
                }`}
                onClick={() => handleCardClick(n)}
              >
                {/* Checkbox (visible in selection mode) */}
                {isSelectionMode && (
                  <div
                    className="pt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(n.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      aria-label={`Select notification ${n.title}`}
                    />
                  </div>
                )}

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
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 w-full">
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
                        <div className="mt-2 flex flex-wrap gap-3 text-xs rounded-md bg-emerald-500/10 px-3 py-2 max-w-full w-fit">
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
                        <div className="mt-2 flex flex-wrap gap-3 text-xs rounded-md bg-red-500/10 px-3 py-2 max-w-full w-fit">
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
                          <div className="flex flex-wrap gap-3 text-xs rounded-md bg-amber-500/10 px-3 py-2 max-w-full w-fit">
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
                        <div className="mt-2 flex flex-wrap gap-4 text-xs rounded-md bg-rose-500/10 px-3 py-2 max-w-full w-fit">
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

                      {/* Review metadata */}
                      {n.type === 'NEW_REVIEW' && meta && (
                        <div className="mt-2 flex flex-col gap-1 text-xs rounded-md bg-purple-500/10 px-3 py-2 max-w-full w-fit">
                          {meta.rating && (
                            <span className="font-bold text-purple-600">
                              {'★'.repeat(Number(meta.rating)) + '☆'.repeat(Math.max(0, 5 - Number(meta.rating)))} ({meta.rating}/5)
                            </span>
                          )}
                          {meta.productName && (
                            <span className="font-medium text-foreground">
                              Product: {String(meta.productName)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* User metadata */}
                      {n.type === 'NEW_USER' && meta?.email && (
                        <div className="mt-2 text-xs rounded-md bg-cyan-500/10 px-3 py-1.5 max-w-full w-fit break-all sm:break-normal font-medium text-cyan-700 dark:text-cyan-400">
                          {String(meta.email)}
                        </div>
                      )}

                      {/* Action links */}
                      {(n.type === 'NEW_ORDER' || n.type === 'ORDER_CANCELLED' || n.type === 'ORDER_STATUS') && (
                        <Link
                          href={
                            meta?.orderNumber
                              ? `/admin/order?orderId=${encodeURIComponent(String(meta.orderNumber))}`
                              : meta?.orderId
                              ? `/admin/order?orderId=${encodeURIComponent(String(meta.orderId))}`
                              : '/admin/order'
                          }
                          className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Order {meta?.orderNumber ? `#${meta.orderNumber}` : ''} →
                        </Link>
                      )}
                      {n.type === 'RETURN_REQUEST' && (
                        <Link
                          href={
                            `/admin/order?tab=returns` +
                            (meta?.returnId ? `&returnId=${encodeURIComponent(String(meta.returnId))}` : '') +
                            (meta?.orderNumber
                              ? `&orderId=${encodeURIComponent(String(meta.orderNumber))}`
                              : meta?.orderId
                              ? `&orderId=${encodeURIComponent(String(meta.orderId))}`
                              : '')
                          }
                          className="mt-2 inline-block text-xs font-medium text-amber-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Return {meta?.orderNumber ? `for #${meta.orderNumber}` : ''} →
                        </Link>
                      )}
                      {n.type === 'NEW_REVIEW' && (
                        <Link
                          href="/admin/reviews"
                          className="mt-2 inline-block text-xs font-medium text-purple-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View in Reviews →
                        </Link>
                      )}
                      {n.type === 'NEW_USER' && (
                        <Link
                          href="/admin/user"
                          className="mt-2 inline-block text-xs font-medium text-cyan-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Customer →
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
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
                          setSelectedIds((prev) => prev.filter((id) => id !== n.id));
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

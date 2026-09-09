'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Info,
  ShoppingCart,
  ChevronRight,
  MessageSquare,
  Users,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { AdminNavContent } from '@/components/layout/AdminSidebar';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/api/admin/notifications';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/order': 'Orders',
  '/admin/product': 'Products',
  '/admin/category': 'Categories',
  '/admin/brand': 'Brands',
  '/admin/inventory': 'Inventory',
  '/admin/offers': 'Offers',
  '/admin/user': 'Customers',
  '/admin/staff': 'Staff Members',
  '/admin/role': 'Roles & Permissions',
  '/admin/reviews': 'Reviews',
  '/admin/reports': 'Reports',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/content': 'Content Management',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
};

const TYPE_CONFIG: Record<
  Notification['type'],
  { label: string; icon: React.ElementType; color: string; emoji: string }
> = {
  NEW_ORDER: { label: 'New Order', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', emoji: '🛒' },
  ORDER_CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-500/10 border-red-500/20', emoji: '❌' },
  RETURN_REQUEST: { label: 'Return', icon: RotateCcw, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', emoji: '📦' },
  LOW_STOCK: { label: 'Low Stock', icon: AlertTriangle, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', emoji: '⚠️' },
  ORDER_STATUS: { label: 'Update', icon: ShoppingCart, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20', emoji: '📋' },
  SYSTEM: { label: 'System', icon: Info, color: 'text-slate-600 bg-slate-500/10 border-slate-500/20', emoji: 'ℹ️' },
  NEW_REVIEW: { label: 'Review', icon: MessageSquare, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20', emoji: '⭐' },
  NEW_USER: { label: 'New User', icon: Users, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20', emoji: '👤' },
};

function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead, isMarkingAllRead } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Page title
  const currentTitle = PAGE_TITLES[pathname] || 'Administration';

  const handleItemClick = (n: Notification) => {
    if (!n.isRead) markRead(n.id);
    setIsOpen(false);
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
    } else {
      router.push('/admin/notifications');
    }
  };

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-2 text-sm">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col w-64 border-r">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <AdminNavContent onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <span className="hidden sm:inline text-muted-foreground font-medium">Admin</span>
        <ChevronRight className="hidden sm:inline h-4 w-4 text-muted-foreground/60" />
        <span className="font-semibold text-foreground text-base tracking-tight truncate max-w-[150px] sm:max-w-none">{currentTitle}</span>
      </div>

      {/* Right: Notification Indicator & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`relative p-2 rounded-xl border transition-all flex items-center justify-center outline-none ${
              unreadCount > 0
                ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Notifications"
            title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
          >
            <Bell className="h-5 w-5" />

            {/* Glowing Pulse & Unread Count Badge */}
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-3.5 border-b bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-rose-500 text-white text-xs px-1.5 py-0">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={isMarkingAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border/50 [scrollbar-width:thin]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => {
                    const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
                    const meta = n.metadata as any;

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`p-3 transition-colors cursor-pointer hover:bg-muted/60 flex items-start gap-3 text-xs ${
                          !n.isRead ? 'bg-primary/[0.04]' : 'bg-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border shrink-0 text-base leading-none ${config.color}`}>
                          {config.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-semibold truncate ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          {meta?.orderNumber && (
                            <span className="inline-block mt-1 font-medium text-[11px] text-primary">
                              Order #{String(meta.orderNumber)}
                            </span>
                          )}
                        </div>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t bg-muted/20 text-center">
                <Link
                  href="/admin/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-primary hover:underline block py-1"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User initials / email snippet */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-primary/20">
              {user.fullName ? user.fullName.charAt(0) : user.email?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left text-xs leading-tight">
              <p className="font-semibold truncate max-w-[120px]">{user.fullName || user.email}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.role ? user.role.toLowerCase() : 'Staff'}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  Settings,
  LogOut,
  Shield,
  Users,
  FolderTree,
  Warehouse,
  Bell,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  MessageSquare,
  Gift,
  LayoutTemplate,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { useAdminSidebarStore } from '@/store/useAdminSidebarStore';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string | string[];
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: ['dashboard:read', 'view_analytics'] },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'view_reports' },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck, permission: 'view_audit_logs' },
  { name: 'Orders', href: '/admin/order', icon: ShoppingBag, permission: ['manage_orders', 'manage_shipments', 'manage_returns'] },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, permission: 'manage_reviews' },
  { name: 'Customers', href: '/admin/user', icon: Users, permission: 'manage_users' },
  { name: 'Staff Members', href: '/admin/staff', icon: UserCog, permission: 'manage_staff' },
  { name: 'Products', href: '/admin/product', icon: Package, permission: 'manage_products' },
  { name: 'Categories', href: '/admin/category', icon: FolderTree, permission: 'manage_categories' },
  { name: 'Brands', href: '/admin/brand', icon: Tag, permission: 'manage_brands' },
  { name: 'Inventory', href: '/admin/inventory', icon: Warehouse, permission: 'manage_inventory' },
  { name: 'Offers', href: '/admin/offers', icon: Gift, permission: 'manage_offers' },
  { name: 'Content Management', href: '/admin/content', icon: LayoutTemplate, permission: 'manage_content' },
  { name: 'Roles', href: '/admin/role', icon: Shield, permission: 'manage_roles' },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'manage_settings' },
];

export function hasNavPermission(
  itemPermission: string | string[] | undefined,
  user: any,
  userPermissions: string[]
): boolean {
  if (!itemPermission) return true;
  const userRole = user?.role || user?.roleId || '';
  const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
  const isAdmin = userRoleUpper === 'ADMIN' || userRoleUpper === 'SUPER_ADMIN' || userPermissions.includes('*');
  if (isAdmin) return true;

  if (Array.isArray(itemPermission)) {
    return itemPermission.some((p) => userPermissions.includes(p));
  }
  return userPermissions.includes(itemPermission);
}

export interface AdminNavContentProps {
  onLinkClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminNavContent({
  onLinkClick,
  isCollapsed = false,
  onToggleCollapse,
}: AdminNavContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutUser, user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const { unreadCount } = useNotifications();

  // Floating tooltip state for collapsed rail mode
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    top: number;
    left: number;
    badge?: number;
  } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, text: string, badge?: number) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      text,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
      badge,
    });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logoutUser();
      toast.success('Logged out successfully');
      router.push('/admin-login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <>
      {/* Sidebar Header */}
      {isCollapsed ? (
        <div className="h-16 border-b shrink-0 flex items-center justify-center px-2">
          <Link
            href="/admin"
            onClick={onLinkClick}
            onMouseEnter={(e) => handleMouseEnter(e, 'YOX Admin (Dashboard)')}
            onMouseLeave={handleMouseLeave}
            className="h-9 w-13 px-1.5 py-1 bg-white rounded-xl shadow-xs border border-border/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="YOX Admin Dashboard"
          >
            <img
              src="/images/logo.png"
              alt="YOX"
              className="h-5 w-auto max-w-full object-contain"
            />
          </Link>
        </div>
      ) : (
        <div className="h-16 px-4 border-b shrink-0 flex items-center">
          <Link
            href="/admin"
            onClick={onLinkClick}
            className="flex items-center gap-2.5 group select-none max-w-full"
          >
            {/* Proportional authentic YOX brand card */}
            <div className="h-9 px-2.5 py-1 bg-white rounded-xl shadow-xs border border-border/50 flex items-center justify-center shrink-0 group-hover:shadow-sm group-hover:scale-[1.02] transition-all">
              <img
                src="/images/logo.png"
                alt="YOX Fashion Store"
                className="h-6 w-auto max-w-[115px] object-contain"
              />
            </div>
            {/* Clean Admin badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25 tracking-wider uppercase shrink-0">
              Admin
            </span>
          </Link>
        </div>
      )}

      {/* Nav List */}
      <nav
        className={`flex-1 overflow-y-auto ${
          isCollapsed ? 'p-2 space-y-1.5' : 'p-3 space-y-1'
        } [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
      >
        {navItems.map((item) => {
          const hasAccess = hasNavPermission(item.permission, user, userPermissions);

          if (!hasAccess) {
            return null;
          }

          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onLinkClick}
                onMouseEnter={(e) =>
                  handleMouseEnter(e, item.name, item.name === 'Notifications' ? unreadCount : undefined)
                }
                onMouseLeave={handleMouseLeave}
                className={`relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-label={item.name}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 ring-2 ring-card shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">{item.name}</span>
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className="min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold px-1.5 shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      {isCollapsed ? (
        <div className="p-2 border-t space-y-1.5 shrink-0 flex flex-col items-center">
          <ThemeToggle collapsed onHover={handleMouseEnter} onLeave={handleMouseLeave} />
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => handleMouseEnter(e, 'Logout')}
            onMouseLeave={handleMouseLeave}
            className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              onMouseEnter={(e) => handleMouseEnter(e, 'Expand sidebar')}
              onMouseLeave={handleMouseLeave}
              className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 border-t space-y-1 shrink-0">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse Sidebar</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Tooltip in Collapsed Rail Mode */}
      {isCollapsed && activeTooltip && (
        <div
          className="fixed pointer-events-none z-50 px-2.5 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-medium shadow-xl border border-border flex items-center gap-2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 duration-100"
          style={{
            top: `${activeTooltip.top}px`,
            left: `${activeTooltip.left}px`,
          }}
        >
          <span>{activeTooltip.text}</span>
          {activeTooltip.badge != null && activeTooltip.badge > 0 && (
            <span className="min-w-[1.25rem] h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1">
              {activeTooltip.badge > 99 ? '99+' : activeTooltip.badge}
            </span>
          )}
        </div>
      )}
    </>
  );
}

export function AdminSidebar() {
  const { isCollapsed, toggleSidebar } = useAdminSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const collapsed = mounted ? isCollapsed : false;

  return (
    <aside
      className={`hidden xl:flex border-r bg-card h-full shrink-0 flex-col transition-[width] duration-300 ease-in-out z-20 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <AdminNavContent
        isCollapsed={collapsed}
        onToggleCollapse={toggleSidebar}
      />
    </aside>
  );
}

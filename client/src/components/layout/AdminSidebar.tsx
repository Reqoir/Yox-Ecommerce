'use client';

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
} from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotifications } from '@/hooks/admin/useNotifications';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'view_reports' },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck, permission: 'view_audit_logs' },
  { name: 'Orders', href: '/admin/order', icon: ShoppingBag },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, permission: 'manage_reviews' },
  { name: 'Users', href: '/admin/user', icon: Users, permission: 'manage_users' },
  { name: 'Products', href: '/admin/product', icon: Package, permission: 'manage_products' },
  { name: 'Categories', href: '/admin/category', icon: FolderTree, permission: 'manage_categories' },
  { name: 'Brands', href: '/admin/brand', icon: Tag, permission: 'manage_brands' },
  { name: 'Inventory', href: '/admin/inventory', icon: Warehouse, permission: 'manage_inventory' },
  { name: 'Offers', href: '/admin/offers', icon: Gift },
  { name: 'Roles', href: '/admin/role', icon: Shield, permission: 'manage_roles' },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutUser, user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logoutUser();
      toast.success('Logged out successfully');
      router.push('/admin-login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <aside className="w-64 border-r bg-card h-full shrink-0 flex flex-col transition-all z-20">
      <div className="p-6 border-b shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary">YOX Admin</h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const userRole = (user as any)?.role || user?.roleId;
          const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'ADMIN' || !user;
          const hasPermission = isAdmin || userPermissions.includes('*') || (item.permission && userPermissions.includes(item.permission));

          if (item.permission && !hasPermission) {
            return null;
          }

          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className="min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-1 shrink-0">
        <ThemeToggle />
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}


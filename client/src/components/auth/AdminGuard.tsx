'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

import { navItems, hasNavPermission } from '@/components/layout/AdminSidebar';

const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  '/admin/user': 'manage_users',
  '/admin/staff': 'manage_staff',
  '/admin/product': 'manage_products',
  '/admin/category': 'manage_categories',
  '/admin/brand': 'manage_brands',
  '/admin/role': 'manage_roles',
  '/admin/inventory': 'manage_inventory',
  '/admin/order': ['manage_orders', 'manage_shipments', 'manage_returns'],
  '/admin/offers': 'manage_offers',
  '/admin/content': 'manage_content',
  '/admin/reviews': 'manage_reviews',
  '/admin/reports': 'view_reports',
  '/admin/audit-logs': 'view_audit_logs',
  '/admin/notifications': 'manage_notifications',
  '/admin/settings': 'manage_settings',
  '/admin': ['dashboard:read', 'view_analytics'],
};

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = () => {
      if (!isAuthenticated || !user) {
        // Redirect to admin login if they try to access admin routes without being authenticated
        if (pathname.startsWith('/admin')) {
          router.push('/admin-login');
        } else {
          router.push('/login');
        }
      } else {
        const userPermissions = user.permissions || [];
        const userRole = user.role || user.roleId || '';
        const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
        const isAdmin = userRoleUpper === 'ADMIN' || userRoleUpper === 'SUPER_ADMIN' || userPermissions.includes('*');

        // Check baseline access to admin panel
        if (pathname.startsWith('/admin') && userPermissions.length === 0 && !isAdmin) {
          toast.error('You do not have permission to access the admin panel.');
          router.push('/');
          return;
        }

        // Check if current route requires specific permissions
        let requiredPermission: string | string[] | undefined;

        if (pathname === '/admin' || pathname === '/admin/') {
          requiredPermission = ['dashboard:read', 'view_analytics'];
        } else {
          const matchedEntry = Object.entries(ROUTE_PERMISSIONS)
            .filter(([route]) => route !== '/admin' && (pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')))
            .sort((a, b) => b[0].length - a[0].length)[0];
          if (matchedEntry) {
            requiredPermission = matchedEntry[1];
          }
        }

        const hasAccess = hasNavPermission(requiredPermission, user, userPermissions);

        if (!hasAccess) {
          // Find first permitted route
          const firstAllowed = navItems.find((item) => hasNavPermission(item.permission, user, userPermissions));

          if (firstAllowed && firstAllowed.href !== pathname) {
            if (pathname !== '/admin' && pathname !== '/admin/') {
              toast.error('You do not have permission to access this page.');
            }
            router.replace(firstAllowed.href);
          } else {
            toast.error('You do not have permission to access the admin panel.');
            router.replace('/');
          }
        } else {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [isMounted, isAuthenticated, user, router, pathname]);

  if (!isMounted || isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}

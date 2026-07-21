'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/user': 'manage_users',
  '/admin/product': 'manage_products',
  '/admin/category': 'manage_categories',
  '/admin/brand': 'manage_brands',
  '/admin/role': 'manage_roles',
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
        // Check if the current route requires specific permissions
        let hasAccess = true;
        const userPermissions = user.permissions || [];

        for (const [route, requiredPermission] of Object.entries(ROUTE_PERMISSIONS)) {
          if (pathname === route || pathname.startsWith(route + '/')) {
            if (!userPermissions.includes(requiredPermission)) {
              hasAccess = false;
              break;
            }
          }
        }

        if (!hasAccess) {
          toast.error('You do not have permission to access this page.');
          router.push('/admin'); // Redirect to the main dashboard
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

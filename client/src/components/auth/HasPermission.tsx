'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { ReactNode } from 'react';

interface HasPermissionProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function HasPermission({ permission, children, fallback = null }: HasPermissionProps) {
  const adminUser = useAdminAuthStore((state) => state.user);
  const authUser = useAuthStore((state) => state.user);
  const user = adminUser || authUser;

  if (!user || !user.permissions) {
    return <>{fallback}</>;
  }

  const permissionsRequired = Array.isArray(permission) ? permission : [permission];
  
  // Check if the user has ALL required permissions
  // If we wanted to check if they had ANY, we would use .some()
  const hasAccess = permissionsRequired.every((p) => user.permissions.includes(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { ReactNode } from 'react';

interface HasPermissionProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function HasPermission({ permission, children, fallback = null }: HasPermissionProps) {
  const { user } = useAuthStore();

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

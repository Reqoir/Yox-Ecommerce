/**
 * @file role.constants.ts
 * @layer Domain › Constants
 * @description Canonical permissions and system role hierarchy definitions.
 */

export const SYSTEM_PERMISSIONS = [
  'dashboard:read',
  'manage_products',
  'manage_inventory',
  'manage_brands',
  'manage_categories',
  'manage_orders',
  'manage_users',
  'view_staff',
  'manage_staff',
  'manage_roles',
  'manage_settings',
  'view_analytics',
  'view_reports',
  'view_audit_logs',
  'manage_reviews',
  'manage_offers',
  'manage_content',
  'manage_notifications',
] as const;

export type SystemPermission = typeof SYSTEM_PERMISSIONS[number];

export interface SystemRoleDefinition {
  name: string;
  description: string;
  level: number;
  isSystem: boolean;
  permissions: string[];
}

export const TARGET_SYSTEM_ROLES: SystemRoleDefinition[] = [
  {
    name: 'Admin',
    description: 'System Administrator with complete store authority',
    level: 100,
    isSystem: true,
    permissions: [
      'dashboard:read',
      'manage_products',
      'manage_inventory',
      'manage_brands',
      'manage_categories',
      'manage_orders',
      'manage_users',
      'view_staff',
      'manage_staff',
      'manage_roles',
      'manage_settings',
      'view_analytics',
      'view_reports',
      'view_audit_logs',
      'manage_reviews',
      'manage_offers',
      'manage_content',
      'manage_notifications',
    ],
  },
  {
    name: 'MANAGER',
    description: 'Store operational manager',
    level: 75,
    isSystem: true,
    permissions: [
      'dashboard:read',
      'view_analytics',
      'view_reports',
      'manage_products',
      'manage_categories',
      'manage_brands',
      'manage_inventory',
      'manage_orders',
      'manage_users',
      'manage_offers',
      'manage_reviews',
      'manage_content',
      'manage_notifications',
      'view_staff',
    ],
  },
  {
    name: 'EDITOR',
    description: 'Catalog, content, and order editor',
    level: 50,
    isSystem: true,
    permissions: [
      'manage_products',
      'manage_categories',
      'manage_brands',
      'manage_content',
      'manage_reviews',
      'manage_orders',
    ],
  },
  {
    name: 'CUSTOMER',
    description: 'Standard store customer',
    level: 0,
    isSystem: true,
    permissions: [],
  },
];

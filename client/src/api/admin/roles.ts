import apiClient from '@/lib/axios';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const PERMISSIONS_LIST = [
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'manage_inventory', label: 'Manage Inventory' },
  { id: 'manage_brands', label: 'Manage Brands' },
  { id: 'manage_categories', label: 'Manage Categories' },
  { id: 'manage_orders', label: 'Manage Orders' },
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_roles', label: 'Manage Roles' },
  { id: 'manage_settings', label: 'Manage Settings' },
  { id: 'view_analytics', label: 'View Analytics' },
  { id: 'view_reports', label: 'View Payment & Financial Reports' },
  { id: 'view_audit_logs', label: 'View Audit Logs' },
];

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get<{ data: Role[] }>('/roles');
    return response.data.data;
  },

  create: async (data: CreateRoleDTO): Promise<Role> => {
    const response = await apiClient.post<{ data: Role }>('/roles', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateRoleDTO): Promise<Role> => {
    const response = await apiClient.patch<{ data: Role }>(`/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};

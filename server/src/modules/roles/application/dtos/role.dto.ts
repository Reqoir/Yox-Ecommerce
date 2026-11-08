/**
 * @file role.dto.ts
 * @layer Application › DTOs
 */

export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  level: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleRequestDTO {
  name: string;
  description?: string;
  permissions: string[];
  level?: number;
}

export interface UpdateRoleRequestDTO {
  name?: string;
  description?: string;
  permissions?: string[];
  level?: number;
}

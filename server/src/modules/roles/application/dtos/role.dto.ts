/**
 * @file role.dto.ts
 * @layer Application › DTOs
 */

export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleRequestDTO {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleRequestDTO {
  name?: string;
  description?: string;
  permissions?: string[];
}

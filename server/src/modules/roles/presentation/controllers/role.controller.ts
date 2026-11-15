/**
 * @file role.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { GetAllRolesUseCase } from '../../application/use-cases/get-all-roles.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { validateRequest } from '@shared/utils/validation.helper';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';
import { ApiError } from '@shared/utils/api-error.util';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly roleRepository?: IRoleRepository,
  ) {}

  private getActorContext = async (user: any): Promise<{
    isSuperAdmin: boolean;
    level: number;
    roleId?: string;
    roleName?: string;
    permissions: string[];
  }> => {
    if (!user) return { isSuperAdmin: false, level: 0, permissions: [] };
    const emailLower = (user.email || '').toLowerCase();

    // Primary Store Owner is Level 100 with universal authority
    if (emailLower === 'admin@yox.com') {
      return { isSuperAdmin: true, level: 100, roleName: 'ADMIN', permissions: ['*'] };
    }

    let actorLevel = 50;
    let roleName = '';
    let permissions: string[] = (user as any)?.permissions || [];
    const roleId = user.roleId || user.role;

    if (this.roleRepository && roleId) {
      try {
        const role = await this.roleRepository.findById(roleId);
        if (role) {
          roleName = (role.name || '').toUpperCase();
          permissions = role.permissions || [];
          if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || permissions.includes('*')) {
            return {
              isSuperAdmin: true,
              level: 100,
              roleId: role.id,
              roleName,
              permissions: ['*'],
            };
          }
          actorLevel = role.level ?? (roleName === 'MANAGER' ? 75 : 50);
          return {
            isSuperAdmin: false,
            level: actorLevel,
            roleId: role.id,
            roleName,
            permissions,
          };
        }
      } catch (err) {
        // fallback
      }
    }

    const fallbackRoleName = (user.role || '').toUpperCase();
    if (fallbackRoleName === 'ADMIN' || fallbackRoleName === 'SUPER_ADMIN') {
      return { isSuperAdmin: true, level: 100, roleName: fallbackRoleName, permissions: ['*'] };
    }

    return {
      isSuperAdmin: false,
      level: actorLevel,
      roleName: fallbackRoleName,
      permissions,
    };
  };

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.getAllRolesUseCase.execute();
      ApiResponse.success(res, roles, 'Roles fetched successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = await this.getActorContext(req.user);
      const validBody = validateRequest(req, createRoleSchema, 'body');

      // Rule: Non-super-admins cannot set rank equal to or higher than their own
      if (!actor.isSuperAdmin && validBody.level !== undefined && actor.level <= validBody.level) {
        throw ApiError.forbidden(
          `Hierarchy Violation: You cannot create a role with rank (Level ${validBody.level}) equal to or higher than your own (Level ${actor.level}).`
        );
      }

      // Rule: Non-super-admins cannot create roles containing 'ADMIN' or 'SUPER' in their name
      const normalizedRoleName = validBody.name.trim().toUpperCase();
      if (!actor.isSuperAdmin && (normalizedRoleName.includes('ADMIN') || normalizedRoleName.includes('SUPER'))) {
        throw ApiError.forbidden('Only the Store Owner can create administrative roles containing "ADMIN" or "SUPER" in their name.');
      }

      // Rule: Non-super-admins cannot grant wildcard '*' permission
      if (!actor.isSuperAdmin && validBody.permissions?.includes('*')) {
        throw ApiError.forbidden('Only the Store Owner can grant full administrative wildcard (*) permissions.');
      }

      // Rule: Non-super-admins cannot grant permissions they do not possess
      if (!actor.isSuperAdmin && validBody.permissions && validBody.permissions.length > 0) {
        const unauthorizedPerms = validBody.permissions.filter((p: string) => !actor.permissions.includes(p));
        if (unauthorizedPerms.length > 0) {
          throw ApiError.forbidden(
            `Permission Escalation Violation: You cannot grant permissions you do not possess: ${unauthorizedPerms.join(', ')}`
          );
        }
      }

      const role = await this.createRoleUseCase.execute(validBody as any);
      ApiResponse.success(res, role, 'Role created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const actor = await this.getActorContext(req.user);
      const validBody = validateRequest(req, updateRoleSchema, 'body');

      if (!this.roleRepository) {
        throw new Error('RoleRepository not configured in RoleController');
      }

      const targetRole = await this.roleRepository.findById(id);
      if (!targetRole) {
        throw ApiError.notFound('Role not found');
      }

      if (targetRole.isSystem) {
        throw ApiError.forbidden(`Security Restriction: System role "${targetRole.name}" is protected and cannot be modified.`);
      }

      const targetRoleName = (targetRole.name || '').toUpperCase();
      const targetRoleLevel = targetRole.level !== undefined
        ? targetRole.level
        : (targetRoleName === 'ADMIN' ? 100 : (targetRoleName === 'CUSTOMER' ? 0 : 50));

      if (!actor.isSuperAdmin) {
        // 1. Protection for ADMIN role: ONLY Store Owner / Super Admin can edit ADMIN role!
        if (targetRoleName === 'ADMIN' || targetRoleLevel >= 100) {
          throw ApiError.forbidden('Security Restriction: Only the primary Store Owner can modify the Administrator role.');
        }

        // 2. Self-Privilege Escalation Prevention: Staff cannot modify their own assigned role!
        const isOwnRole = Boolean(
          (actor.roleId && targetRole.id === actor.roleId) ||
          (actor.roleName && targetRoleName === actor.roleName)
        );
        if (isOwnRole) {
          throw ApiError.forbidden(
            'Self-Privilege Escalation Prevention: You cannot modify your own assigned role or its permissions.'
          );
        }

        // 3. Hierarchy Rule: Staff cannot modify roles with equal or higher rank
        if (actor.level <= targetRoleLevel) {
          throw ApiError.forbidden(
            `Hierarchy Violation: Your role rank (Level ${actor.level}) cannot modify a role with equal or higher rank (Level ${targetRoleLevel}).`
          );
        }

        // 4. Hierarchy Rule: Staff cannot elevate a role's rank to equal or higher than their own
        if (validBody.level !== undefined && actor.level <= validBody.level) {
          throw ApiError.forbidden(
            `Hierarchy Violation: You cannot assign a role rank (Level ${validBody.level}) equal to or higher than your own (Level ${actor.level}).`
          );
        }

        // 5. Name check: Non-super-admins cannot rename role to contain 'ADMIN' or 'SUPER'
        if (validBody.name) {
          const normalizedNewName = validBody.name.trim().toUpperCase();
          if (normalizedNewName.includes('ADMIN') || normalizedNewName.includes('SUPER')) {
            throw ApiError.forbidden('Only the Store Owner can rename roles to contain "ADMIN" or "SUPER".');
          }
        }

        // 6. Wildcard permission check
        if (validBody.permissions?.includes('*')) {
          throw ApiError.forbidden('Only the Store Owner can grant full administrative wildcard (*) permissions.');
        }

        // 7. Rule: Non-super-admins cannot grant permissions they do not possess
        if (validBody.permissions && validBody.permissions.length > 0) {
          const unauthorizedPerms = validBody.permissions.filter((p: string) => !actor.permissions.includes(p));
          if (unauthorizedPerms.length > 0) {
            throw ApiError.forbidden(
              `Permission Escalation Violation: You cannot grant permissions you do not possess: ${unauthorizedPerms.join(', ')}`
            );
          }
        }
      }

      const role = await this.updateRoleUseCase.execute({ id, data: validBody as any });
      ApiResponse.success(res, role, 'Role updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const actor = await this.getActorContext(req.user);

      if (!this.roleRepository) {
        throw new Error('RoleRepository not configured in RoleController');
      }

      const targetRole = await this.roleRepository.findById(id);
      if (!targetRole) {
        throw ApiError.notFound('Role not found');
      }

      const targetRoleName = (targetRole.name || '').toUpperCase();
      const targetRoleLevel = targetRole.level !== undefined
        ? targetRole.level
        : (targetRoleName === 'ADMIN' ? 100 : (targetRoleName === 'CUSTOMER' ? 0 : 50));

      // System roles can never be deleted
      if (targetRole.isSystem) {
        throw ApiError.forbidden('System roles are permanent and cannot be deleted.');
      }

      if (!actor.isSuperAdmin) {
        // Cannot delete ADMIN
        if (targetRoleName === 'ADMIN' || targetRoleLevel >= 100) {
          throw ApiError.forbidden('Security Restriction: The Administrator role is permanently protected.');
        }

        // Cannot delete own role
        const isOwnRole = Boolean(
          (actor.roleId && targetRole.id === actor.roleId) ||
          (actor.roleName && targetRoleName === actor.roleName)
        );
        if (isOwnRole) {
          throw ApiError.forbidden('You cannot delete your own assigned role.');
        }

        // Hierarchy rule
        if (actor.level <= targetRoleLevel) {
          throw ApiError.forbidden(
            `Hierarchy Violation: Your role rank (Level ${actor.level}) cannot delete a role with equal or higher rank (Level ${targetRoleLevel}).`
          );
        }
      }

      await this.deleteRoleUseCase.execute(id);
      ApiResponse.success(res, null, 'Role deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

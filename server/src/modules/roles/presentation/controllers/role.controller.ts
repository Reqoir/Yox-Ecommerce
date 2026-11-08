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
  }> => {
    if (!user) return { isSuperAdmin: false, level: 0 };
    const emailLower = (user.email || '').toLowerCase();

    // Primary Store Owner is Level 100 with universal authority
    if (emailLower === 'admin@yox.com') {
      return { isSuperAdmin: true, level: 100, roleName: 'ADMIN' };
    }

    let actorLevel = 50;
    let roleName = '';
    const roleId = user.roleId || user.role;

    if (this.roleRepository && roleId) {
      try {
        const role = await this.roleRepository.findById(roleId);
        if (role) {
          roleName = (role.name || '').toUpperCase();
          if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || role.permissions.includes('*')) {
            return {
              isSuperAdmin: true,
              level: 100,
              roleId: role.id,
              roleName,
            };
          }
          actorLevel = role.level ?? (roleName === 'MANAGER' ? 75 : 50);
          return {
            isSuperAdmin: false,
            level: actorLevel,
            roleId: role.id,
            roleName,
          };
        }
      } catch (err) {
        // fallback
      }
    }

    const fallbackRoleName = (user.role || '').toUpperCase();
    if (fallbackRoleName === 'ADMIN' || fallbackRoleName === 'SUPER_ADMIN') {
      return { isSuperAdmin: true, level: 100, roleName: fallbackRoleName };
    }

    return {
      isSuperAdmin: false,
      level: actorLevel,
      roleName: fallbackRoleName,
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

      // Rule: Non-super-admins cannot grant wildcard '*' permission
      if (!actor.isSuperAdmin && validBody.permissions?.includes('*')) {
        throw ApiError.forbidden('Only the Store Owner can grant full administrative wildcard (*) permissions.');
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

        // 5. Wildcard permission check
        if (validBody.permissions?.includes('*')) {
          throw ApiError.forbidden('Only the Store Owner can grant full administrative wildcard (*) permissions.');
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

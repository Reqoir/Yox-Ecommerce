/**
 * @file user.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '../../application/use-cases/update-user-status.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { validateRequest } from '@shared/utils/validation.helper';
import { updateUserRoleSchema, createUserSchema, updateUserStatusSchema, resetStaffPasswordSchema, updateStaffSchema } from '../validators/user.validator';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UpdateStaffUseCase } from '../../application/use-cases/update-staff.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { hashPassword } from '@shared/utils/password.helper';
import { NotFoundError } from '@core/application/errors/application.error';
import { ApiError } from '@shared/utils/api-error.util';

export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly userRepository?: IUserRepository,
    private readonly updateStaffUseCase?: UpdateStaffUseCase,
    private readonly roleRepository?: IRoleRepository
  ) {}

  private getActorContext = async (user: any): Promise<{
    isSuperAdmin: boolean;
    canManageStaff: boolean;
    level: number;
  }> => {
    if (!user) return { isSuperAdmin: false, canManageStaff: false, level: 0 };
    const emailLower = (user.email || '').toLowerCase();
    const roleId = user.role;
    
    // Store Owner is Level 100
    if (emailLower === 'admin@yox.com') {
      return { isSuperAdmin: true, canManageStaff: true, level: 100 };
    }

    let isSuperAdmin = false;
    let canManageStaff = false;
    let level = 20;

    if (this.roleRepository && roleId) {
      try {
        const role = await this.roleRepository.findById(roleId);
        if (role) {
          const roleName = role.name.toUpperCase();
          const perms = role.permissions || [];
          level = role.level ?? (roleName === 'ADMIN' ? 90 : 20);

          if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || perms.includes('*')) {
            isSuperAdmin = true;
            canManageStaff = true;
            level = Math.max(level, 90);
          } else if (
            perms.includes('manage_staff') ||
            perms.includes('manage_users') ||
            perms.includes('manage_roles')
          ) {
            canManageStaff = true;
          }
        }
      } catch (err) {
        // fallback
      }
    }

    return { isSuperAdmin, canManageStaff, level };
  };

  private getUserLevel = async (targetUser: any): Promise<number> => {
    if (!targetUser) return 0;
    if (targetUser.email && targetUser.email.toLowerCase() === 'admin@yox.com') {
      return 100;
    }
    if (this.roleRepository && targetUser.roleId) {
      try {
        const role = await this.roleRepository.findById(targetUser.roleId);
        if (role) {
          const roleName = role.name.toUpperCase();
          if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || role.permissions.includes('*')) {
            return Math.max(role.level ?? 100, 100);
          }
          if (roleName === 'CUSTOMER') {
            return role.level ?? 0;
          }
          return role.level ?? (roleName === 'MANAGER' ? 75 : 50);
        }
      } catch (err) {
        // fallback
      }
    }
    return 50;
  };

  private getRoleLevel = async (roleId: string): Promise<number> => {
    if (!roleId || !this.roleRepository) return 50;
    try {
      const role = await this.roleRepository.findById(roleId);
      if (role) {
        const roleName = role.name.toUpperCase();
        if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || role.permissions.includes('*')) {
          return Math.max(role.level ?? 100, 100);
        }
        if (roleName === 'CUSTOMER') {
          return role.level ?? 0;
        }
        return role.level ?? (roleName === 'MANAGER' ? 75 : 50);
      }
    } catch (err) {
      // fallback
    }
    return 50;
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user is guaranteed to exist because of requireAuth middleware
      const userId = req.user!.id;
      
      const { user, permissions } = await this.getProfileUseCase.execute(userId);

      // Return user without password
      const result = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        roleId: user.roleId,
        permissions,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        status: user.status,
        createdAt: user.createdAt,
      };

      ApiResponse.success(res, result, 'Profile retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      
      // In a real scenario, validate req.body with Zod here
      const updatedUser = await this.updateProfileUseCase.execute(userId, req.body);

      const result = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email && !updatedUser.email.endsWith('@user.yox.internal') ? updatedUser.email : null,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
      };

      ApiResponse.success(res, result, 'Profile updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllUsersUseCase.execute(req.query);
      ApiResponse.success(res, result.users, 'Users retrieved successfully', HttpStatus.OK, result.meta as unknown as Record<string, unknown>);
    } catch (error) {
      next(error);
    }
  };

  public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to modify staff roles.');
      }

      const { id } = req.params;
      const validBody = validateRequest(req, updateUserRoleSchema, 'body');

      const targetUser = await this.userRepository?.findById(id);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (targetUser.email && targetUser.email.toLowerCase() === 'admin@yox.com') {
        throw ApiError.forbidden('The primary Store Owner role cannot be modified.');
      }

      if (req.user?.id === id) {
        throw ApiError.forbidden('You cannot change your own role.');
      }

      const targetLevel = await this.getUserLevel(targetUser);
      if (actorLevel <= targetLevel) {
        throw ApiError.forbidden(
          `Hierarchy Violation: Your role rank (Level ${actorLevel}) cannot modify a staff member with equal or higher rank (Level ${targetLevel}).`
        );
      }

      if (validBody.roleId) {
        const newRoleLevel = await this.getRoleLevel(validBody.roleId);
        if (actorLevel <= newRoleLevel) {
          throw ApiError.forbidden(
            `Hierarchy Violation: You cannot assign a role with equal or higher rank (Level ${newRoleLevel}) than your own (Level ${actorLevel}).`
          );
        }
      }

      const result = await this.updateUserRoleUseCase.execute({
        userId: id,
        roleId: validBody.roleId,
        email: validBody.email,
        password: validBody.password,
      });

      ApiResponse.success(res, result, 'User role updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to reset staff passwords.');
      }

      const { id } = req.params;
      const validBody = validateRequest(req, resetStaffPasswordSchema, 'body');

      if (!this.userRepository) {
        throw new Error('User repository not available');
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.email && user.email.toLowerCase() === 'admin@yox.com') {
        throw ApiError.forbidden('The primary Store Owner password cannot be reset from the staff console.');
      }

      const targetLevel = await this.getUserLevel(user);
      if (actorLevel <= targetLevel) {
        throw ApiError.forbidden(
          `Hierarchy Violation: Your role rank (Level ${actorLevel}) cannot reset the password of a staff member with equal or higher rank (Level ${targetLevel}).`
        );
      }

      const hashedPassword = await hashPassword(validBody.password);
      user.updatePassword(hashedPassword);
      await this.userRepository.update(user.id, user);

      ApiResponse.success(res, null, 'Staff password reset successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to register new staff members.');
      }

      const validBody = validateRequest(req, createUserSchema, 'body');

      if (validBody.roleId) {
        const assignedRoleLevel = await this.getRoleLevel(validBody.roleId);
        if (actorLevel <= assignedRoleLevel) {
          throw ApiError.forbidden(
            `Hierarchy Violation: You cannot create a staff member with equal or higher role rank (Level ${assignedRoleLevel}) than your own (Level ${actorLevel}).`
          );
        }
      }
      
      const result = await this.createUserUseCase.execute(validBody);
      
      ApiResponse.success(res, result, 'User created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getUserByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'User retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to change staff account status.');
      }

      const { id } = req.params;
      const validBody = validateRequest(req, updateUserStatusSchema, 'body');

      const targetUser = await this.userRepository?.findById(id);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (targetUser.email && targetUser.email.toLowerCase() === 'admin@yox.com') {
        throw ApiError.forbidden('The primary Store Owner account cannot be suspended or deactivated.');
      }

      if (req.user?.id === id) {
        throw ApiError.forbidden('You cannot change your own account status.');
      }

      const targetLevel = await this.getUserLevel(targetUser);
      if (actorLevel <= targetLevel) {
        throw ApiError.forbidden(
          `Hierarchy Violation: Your role rank (Level ${actorLevel}) cannot suspend or activate a staff member with equal or higher rank (Level ${targetLevel}).`
        );
      }

      const result = await this.updateUserStatusUseCase.execute({
        userId: id,
        status: validBody.status as any,
      });

      ApiResponse.success(res, result, 'User status updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to remove staff members.');
      }

      const { id } = req.params;

      const targetUser = await this.userRepository?.findById(id);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (targetUser.email && targetUser.email.toLowerCase() === 'admin@yox.com') {
        throw ApiError.forbidden('The primary Store Owner account cannot be removed.');
      }

      if (req.user?.id === id) {
        throw ApiError.forbidden('You cannot delete your own active administrator account.');
      }

      const targetLevel = await this.getUserLevel(targetUser);
      if (actorLevel <= targetLevel) {
        throw ApiError.forbidden(
          `Hierarchy Violation: Your role rank (Level ${actorLevel}) cannot remove a staff member with equal or higher rank (Level ${targetLevel}).`
        );
      }

      const result = await this.deleteUserUseCase.execute({ userId: id });
      ApiResponse.success(res, result, result.message, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { canManageStaff, level: actorLevel } = await this.getActorContext(req.user);
      if (!canManageStaff) {
        throw ApiError.forbidden('You do not have permission to update staff credentials.');
      }

      const { id } = req.params;
      const validBody = validateRequest(req, updateStaffSchema, 'body');

      if (!this.updateStaffUseCase) {
        throw new Error('UpdateStaffUseCase not configured');
      }

      const targetUser = await this.userRepository?.findById(id);
      if (!targetUser) {
        throw new NotFoundError('Staff member not found');
      }

      const targetLevel = await this.getUserLevel(targetUser);
      if (actorLevel <= targetLevel) {
        throw ApiError.forbidden(
          `Hierarchy Violation: Your role rank (Level ${actorLevel}) cannot modify a staff member with equal or higher rank (Level ${targetLevel}).`
        );
      }

      if (validBody.roleId) {
        const newRoleLevel = await this.getRoleLevel(validBody.roleId);
        if (actorLevel <= newRoleLevel) {
          throw ApiError.forbidden(
            `Hierarchy Violation: You cannot assign a role with equal or higher rank (Level ${newRoleLevel}) than your own (Level ${actorLevel}).`
          );
        }
      }

      const result = await this.updateStaffUseCase.execute({
        userId: id,
        fullName: validBody.fullName,
        email: validBody.email,
        phone: validBody.phone,
        roleId: validBody.roleId,
        actor: {
          id: req.user!.id,
          email: req.user!.email,
          role: req.user!.role,
          permissions: (req.user as any)?.permissions,
        },
      });

      ApiResponse.success(res, result, 'Staff member credentials updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

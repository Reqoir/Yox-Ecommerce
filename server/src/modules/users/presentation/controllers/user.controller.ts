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
import { validateRequest } from '@shared/utils/validation.helper';
import { updateUserRoleSchema } from '../validators/user.validator';

export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase
  ) {}

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user is guaranteed to exist because of requireAuth middleware
      const userId = req.user!.id;
      
      const user = await this.getProfileUseCase.execute(userId);

      // Return user without password
      const result = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        roleId: user.roleId,
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
        email: updatedUser.email,
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
      ApiResponse.success(res, result.users, 'Users retrieved successfully', HttpStatus.OK, result.meta);
    } catch (error) {
      next(error);
    }
  };

  public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, updateUserRoleSchema, 'body');

      const result = await this.updateUserRoleUseCase.execute({
        userId: id,
        roleId: validBody.roleId,
      });

      ApiResponse.success(res, result, 'User role updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

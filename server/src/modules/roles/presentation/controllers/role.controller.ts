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

export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

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
      const validBody = validateRequest(req, createRoleSchema, 'body');
      const role = await this.createRoleUseCase.execute(validBody as any);
      ApiResponse.success(res, role, 'Role created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const validBody = validateRequest(req, updateRoleSchema, 'body');
      const role = await this.updateRoleUseCase.execute({ id, data: validBody as any });
      ApiResponse.success(res, role, 'Role updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      await this.deleteRoleUseCase.execute(id);
      ApiResponse.success(res, null, 'Role deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

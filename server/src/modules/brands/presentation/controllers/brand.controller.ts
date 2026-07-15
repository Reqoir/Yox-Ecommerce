/**
 * @file brand.controller.ts
 * @layer Presentation › Controllers
 *
 * HTTP Controller for Brand endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { CreateBrandUseCase } from '../../application/use-cases/create-brand.use-case';
import { GetBrandUseCase } from '../../application/use-cases/get-brand.use-case';
import { GetAllBrandsUseCase } from '../../application/use-cases/get-all-brands.use-case';
import { UpdateBrandUseCase } from '../../application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from '../../application/use-cases/delete-brand.use-case';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';
import {
  createBrandSchema,
  updateBrandSchema,
  getBrandSchema,
  deleteBrandSchema,
  getAllBrandsSchema,
} from '../validators/brand.validator';

export class BrandController {
  constructor(
    private readonly createBrandUseCase: CreateBrandUseCase,
    private readonly getBrandUseCase: GetBrandUseCase,
    private readonly getAllBrandsUseCase: GetAllBrandsUseCase,
    private readonly updateBrandUseCase: UpdateBrandUseCase,
    private readonly deleteBrandUseCase: DeleteBrandUseCase,
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validData = validateRequest(req, createBrandSchema, 'body');
      const result = await this.createBrandUseCase.execute(validData);
      ApiResponse.success(res, result, 'Brand created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validParams = validateRequest(req, getBrandSchema, 'params');
      const result = await this.getBrandUseCase.execute(validParams.id);
      ApiResponse.success(res, result, 'Brand retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, getAllBrandsSchema, 'query');
      const result = await this.getAllBrandsUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Brands retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validParams = validateRequest(req, getBrandSchema, 'params');
      const validBody = validateRequest(req, updateBrandSchema, 'body');
      const result = await this.updateBrandUseCase.execute(validParams.id, validBody);
      ApiResponse.success(res, result, 'Brand updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validParams = validateRequest(req, deleteBrandSchema, 'params');
      await this.deleteBrandUseCase.execute(validParams.id);
      ApiResponse.success(res, null, 'Brand deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

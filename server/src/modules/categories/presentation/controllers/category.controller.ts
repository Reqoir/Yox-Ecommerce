/**
 * @file category.controller.ts
 * @layer Presentation › Controllers
 * 
 * HTTP Controller for Category endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  CreateCategoryUseCase, 
  UpdateCategoryUseCase, 
  DeleteCategoryUseCase, 
  GetCategoryByIdUseCase, 
  GetAllCategoriesUseCase
} from '../../application/use-cases/category.use-cases';
import { CreateCategoryRequestDTO, UpdateCategoryRequestDTO } from '../../application/dtos/category.dto';
import { createCategorySchema, updateCategorySchema, categoryListQuerySchema } from '../validators/category.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, createCategorySchema as any, 'body') as CreateCategoryRequestDTO;
      const result = await this.createCategoryUseCase.execute(validBody);
      ApiResponse.success(res, result, 'Category created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, categoryListQuerySchema as any, 'query');
      const result = await this.getAllCategoriesUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Categories retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getCategoryByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Category retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, updateCategorySchema as any, 'body') as UpdateCategoryRequestDTO;
      const result = await this.updateCategoryUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Category updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteCategoryUseCase.execute(id);
      ApiResponse.success(res, null, 'Category deleted successfully', HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };
}

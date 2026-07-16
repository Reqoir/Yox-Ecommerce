/**
 * @file product-variant.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { 
  CreateProductVariantUseCase, 
  UpdateProductVariantUseCase, 
  DeleteProductVariantUseCase, 
  GetProductVariantByIdUseCase, 
  GetAllProductVariantsUseCase 
} from '../../application/use-cases/product-variant.use-cases';
import { CreateProductVariantRequestDTO, UpdateProductVariantRequestDTO } from '../../application/dtos/product-variant.dto';
import { createProductVariantSchema, updateProductVariantSchema, productVariantListQuerySchema } from '../validators/product-variant.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class ProductVariantController {
  constructor(
    private readonly createVariantUseCase: CreateProductVariantUseCase,
    private readonly updateVariantUseCase: UpdateProductVariantUseCase,
    private readonly deleteVariantUseCase: DeleteProductVariantUseCase,
    private readonly getVariantByIdUseCase: GetProductVariantByIdUseCase,
    private readonly getAllVariantsUseCase: GetAllProductVariantsUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, createProductVariantSchema as any, 'body') as CreateProductVariantRequestDTO;
      const result = await this.createVariantUseCase.execute(validBody);
      ApiResponse.success(res, result, 'Product variant created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, productVariantListQuerySchema as any, 'query');
      const result = await this.getAllVariantsUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Product variants retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getVariantByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Product variant retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, updateProductVariantSchema as any, 'body') as UpdateProductVariantRequestDTO;
      const result = await this.updateVariantUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Product variant updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteVariantUseCase.execute(id);
      ApiResponse.success(res, null, 'Product variant deleted successfully', HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };
}

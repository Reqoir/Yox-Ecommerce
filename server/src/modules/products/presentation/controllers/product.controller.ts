/**
 * @file product.controller.ts
 * @layer Presentation › Controllers
 * 
 * HTTP Controller for Product endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  CreateProductUseCase, 
  UpdateProductUseCase, 
  DeleteProductUseCase, 
  GetProductByIdUseCase, 
  GetProductByBarcodeUseCase,
  GetAllProductsUseCase,
  GetFeaturedProductsUseCase,
  GetLatestProductsUseCase,
  GetBestSellingProductsUseCase
} from '../../application/use-cases/product.use-cases';
import { CreateProductRequestDTO, UpdateProductRequestDTO } from '../../application/dtos/product.dto';
import { createProductSchema, updateProductSchema, productListQuerySchema } from '../validators/product.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getProductByBarcodeUseCase: GetProductByBarcodeUseCase,
    private readonly getAllProductsUseCase: GetAllProductsUseCase,
    private readonly getFeaturedProductsUseCase: GetFeaturedProductsUseCase,
    private readonly getLatestProductsUseCase: GetLatestProductsUseCase,
    private readonly getBestSellingProductsUseCase: GetBestSellingProductsUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, createProductSchema as any, 'body') as CreateProductRequestDTO;
      const result = await this.createProductUseCase.execute(validBody);
      ApiResponse.success(res, result, 'Product created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, productListQuerySchema as any, 'query');
      const result = await this.getAllProductsUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Products retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getProductByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Product retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getByBarcode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { barcode } = req.params;
      const result = await this.getProductByBarcodeUseCase.execute(barcode);
      if (!result) {
        ApiResponse.error(res, 'No product found with this barcode', HttpStatus.NOT_FOUND);
        return;
      }
      ApiResponse.success(res, result, 'Product retrieved successfully by barcode', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, updateProductSchema as any, 'body') as UpdateProductRequestDTO;
      const result = await this.updateProductUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Product updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteProductUseCase.execute(id);
      ApiResponse.success(res, null, 'Product deleted successfully', HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };

  public getFeatured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.getFeaturedProductsUseCase.execute(limit);
      ApiResponse.success(res, result, 'Featured products retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.getLatestProductsUseCase.execute(limit);
      ApiResponse.success(res, result, 'Latest products retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getBestSelling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.getBestSellingProductsUseCase.execute(limit);
      ApiResponse.success(res, result, 'Best selling products retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

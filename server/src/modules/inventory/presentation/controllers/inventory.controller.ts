/**
 * @file inventory.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { 
  GetAllInventoryUseCase, 
  GetInventoryByIdUseCase, 
  UpdateInventoryUseCase, 
  AdjustStockUseCase,
  GetStockLogsUseCase
} from '../../application/use-cases/inventory.use-cases';
import { UpdateInventoryRequestDTO, AdjustStockRequestDTO } from '../../application/dtos/inventory.dto';
import { updateInventorySchema, adjustStockSchema, inventoryListQuerySchema, stockLogListQuerySchema } from '../validators/inventory.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class InventoryController {
  constructor(
    private readonly getAllInventoryUseCase: GetAllInventoryUseCase,
    private readonly getInventoryByIdUseCase: GetInventoryByIdUseCase,
    private readonly updateInventoryUseCase: UpdateInventoryUseCase,
    private readonly adjustStockUseCase: AdjustStockUseCase,
    private readonly getStockLogsUseCase: GetStockLogsUseCase
  ) {}

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, inventoryListQuerySchema as any, 'query');
      const result = await this.getAllInventoryUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Inventory retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getInventoryByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Inventory retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, updateInventorySchema as any, 'body') as UpdateInventoryRequestDTO;
      const result = await this.updateInventoryUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Inventory updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, adjustStockSchema as any, 'body') as AdjustStockRequestDTO;
      const result = await this.adjustStockUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Stock adjusted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validQuery = validateRequest(req, stockLogListQuerySchema as any, 'query');
      const result = await this.getStockLogsUseCase.execute({ inventoryId: id, query: validQuery });
      ApiResponse.success(res, result, 'Stock logs retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

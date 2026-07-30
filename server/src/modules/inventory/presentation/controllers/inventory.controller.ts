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
  ReserveStockUseCase,
  ReleaseStockUseCase,
  GetStockLogsUseCase,
  GetLowStockUseCase,
} from '../../application/use-cases/inventory.use-cases';
import {
  UpdateInventoryRequestDTO,
  AdjustStockRequestDTO,
  ReserveStockRequestDTO,
  ReleaseStockRequestDTO,
} from '../../application/dtos/inventory.dto';
import {
  updateInventorySchema,
  adjustStockSchema,
  reserveStockSchema,
  releaseStockSchema,
  inventoryListQuerySchema,
  stockLogListQuerySchema,
  lowStockQuerySchema,
} from '../validators/inventory.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class InventoryController {
  constructor(
    private readonly getAllInventoryUseCase: GetAllInventoryUseCase,
    private readonly getInventoryByIdUseCase: GetInventoryByIdUseCase,
    private readonly updateInventoryUseCase: UpdateInventoryUseCase,
    private readonly adjustStockUseCase: AdjustStockUseCase,
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly releaseStockUseCase: ReleaseStockUseCase,
    private readonly getStockLogsUseCase: GetStockLogsUseCase,
    private readonly getLowStockUseCase: GetLowStockUseCase
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

  /**
   * POST /:id/reserve
   * Reserves stock for a pending order. Available to any authenticated user (checkout flow).
   * The inventory ID is the ID of the inventory record linked to the product variant.
   */
  public reserve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, reserveStockSchema as any, 'body') as ReserveStockRequestDTO;
      const result = await this.reserveStockUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Stock reserved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /:id/release
   * Releases a reservation. action=CANCEL returns stock to available; action=FULFILL consumes it.
   * Typically called by the orders module when order status changes.
   */
  public release = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validBody = validateRequest(req, releaseStockSchema as any, 'body') as ReleaseStockRequestDTO;
      const result = await this.releaseStockUseCase.execute({ id, data: validBody });
      ApiResponse.success(res, result, 'Stock reservation released successfully', HttpStatus.OK);
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

  /**
   * GET /low-stock
   * Returns all inventory items where availableStock <= lowStockThreshold.
   * Admin-only endpoint for the alerts dashboard.
   */
  public getLowStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validQuery = validateRequest(req, lowStockQuerySchema as any, 'query');
      const result = await this.getLowStockUseCase.execute(validQuery);
      ApiResponse.success(res, result, 'Low stock inventory retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

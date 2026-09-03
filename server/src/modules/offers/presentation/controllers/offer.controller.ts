/**
 * @file offer.controller.ts
 * @layer Presentation › Controllers
 * 
 * HTTP Controller for Offer endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreateOfferUseCase,
  UpdateOfferUseCase,
  DeleteOfferUseCase,
  GetOfferByIdUseCase,
  GetAllOffersUseCase,
  GetActiveOffersUseCase,
  GetActiveBannersUseCase,
  GetBestOfferForProductUseCase,
  GetOfferWithProductsUseCase,
} from '../../application/use-cases/offer.use-cases';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class OfferController {
  constructor(
    private readonly createOfferUseCase: CreateOfferUseCase,
    private readonly updateOfferUseCase: UpdateOfferUseCase,
    private readonly deleteOfferUseCase: DeleteOfferUseCase,
    private readonly getOfferByIdUseCase: GetOfferByIdUseCase,
    private readonly getAllOffersUseCase: GetAllOffersUseCase,
    private readonly getActiveOffersUseCase: GetActiveOffersUseCase,
    private readonly getActiveBannersUseCase: GetActiveBannersUseCase,
    private readonly getBestOfferForProductUseCase: GetBestOfferForProductUseCase,
    private readonly getOfferWithProductsUseCase: GetOfferWithProductsUseCase
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createOfferUseCase.execute(req.body);
      ApiResponse.success(res, result, 'Offer created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.updateOfferUseCase.execute({ id, data: req.body });
      ApiResponse.success(res, result, 'Offer updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const current = await this.getOfferByIdUseCase.execute(id);
      const result = await this.updateOfferUseCase.execute({
        id,
        data: { isActive: !current.isActive },
      });
      ApiResponse.success(res, result, `Offer ${result.isActive ? 'activated' : 'deactivated'} successfully`, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteOfferUseCase.execute(id);
      ApiResponse.success(res, null, 'Offer deleted successfully', HttpStatus.NO_CONTENT);
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getOfferByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Offer retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllOffersUseCase.execute(req.query);
      ApiResponse.success(res, result, 'Offers retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getActiveOffersUseCase.execute();
      ApiResponse.success(res, result, 'Active offers retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getBanners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getActiveBannersUseCase.execute();
      ApiResponse.success(res, result, 'Offer banners retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getBestOfferForProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const result = await this.getBestOfferForProductUseCase.execute(productId);
      ApiResponse.success(res, result, 'Product best offer evaluated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  public getWithProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getOfferWithProductsUseCase.execute(id);
      ApiResponse.success(res, result, 'Offer with products retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

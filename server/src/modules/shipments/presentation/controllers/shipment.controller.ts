/**
 * @file shipment.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import {
  CreateShipmentUseCase,
  GetShipmentByIdUseCase,
  GetShipmentByOrderUseCase,
  TrackShipmentUseCase,
  UpdateShipmentStatusUseCase,
  GetAllShipmentsUseCase,
  SyncCourierStatusUseCase,
  GenerateShipmentLabelUseCase,
  GenerateShipmentInvoiceUseCase,
  HandleShiprocketWebhookUseCase,
} from '../../application/use-cases/shipment.use-cases';

export class ShipmentController {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    private readonly getShipmentByIdUseCase: GetShipmentByIdUseCase,
    private readonly getShipmentByOrderUseCase: GetShipmentByOrderUseCase,
    private readonly trackShipmentUseCase: TrackShipmentUseCase,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
    private readonly getAllShipmentsUseCase: GetAllShipmentsUseCase,
    private readonly syncCourierStatusUseCase?: SyncCourierStatusUseCase,
    private readonly generateShipmentLabelUseCase?: GenerateShipmentLabelUseCase,
    private readonly generateShipmentInvoiceUseCase?: GenerateShipmentInvoiceUseCase,
    private readonly handleShiprocketWebhookUseCase?: HandleShiprocketWebhookUseCase
  ) {}

  createShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipment = await this.createShipmentUseCase.execute(req.body);
      ApiResponse.success(res, shipment, 'Shipment created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getShipmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipment = await this.getShipmentByIdUseCase.execute(req.params.id as string);
      ApiResponse.success(res, shipment, 'Shipment details retrieved');
    } catch (error) {
      next(error);
    }
  };

  getShipmentByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipment = await this.getShipmentByOrderUseCase.execute(req.params.orderId as string);
      ApiResponse.success(
        res,
        shipment,
        shipment ? 'Shipment details for order retrieved' : 'No shipment record found for this order'
      );
    } catch (error) {
      next(error);
    }
  };

  trackShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipment = await this.trackShipmentUseCase.execute(req.params.trackingNumber as string);
      ApiResponse.success(res, shipment, 'Shipment tracking info retrieved');
    } catch (error) {
      next(error);
    }
  };

  syncCourierStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.syncCourierStatusUseCase) {
        throw new Error('Sync courier status service not configured');
      }
      const shipment = await this.syncCourierStatusUseCase.execute(req.params.orderId as string);
      ApiResponse.success(res, shipment, 'Courier tracking status synced successfully');
    } catch (error) {
      next(error);
    }
  };

  generateLabel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.generateShipmentLabelUseCase) {
        throw new Error('Generate shipment label service not configured');
      }
      const result = await this.generateShipmentLabelUseCase.execute(req.params.orderId as string);
      ApiResponse.success(res, result, 'Shipping label generated successfully');
    } catch (error) {
      next(error);
    }
  };

  generateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.generateShipmentInvoiceUseCase) {
        throw new Error('Generate shipment invoice service not configured');
      }
      const result = await this.generateShipmentInvoiceUseCase.execute(req.params.orderId as string);
      ApiResponse.success(res, result, 'Shipping invoice generated successfully');
    } catch (error) {
      next(error);
    }
  };

  handleShiprocketWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.handleShiprocketWebhookUseCase) {
        res.status(200).json({ success: true });
        return;
      }
      const result = await this.handleShiprocketWebhookUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipment = await this.updateShipmentStatusUseCase.execute({
        id: req.params.id as string,
        data: req.body,
      });
      ApiResponse.success(res, shipment, 'Shipment status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllShipments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllShipmentsUseCase.execute(req.query);
      ApiResponse.success(res, result, 'Shipments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

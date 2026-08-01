/**
 * @file order.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';
import {
  PlaceOrderUseCase,
  GetAllOrdersUseCase,
  GetOrderByIdUseCase,
  CancelOrderUseCase,
  ConfirmOrderUseCase,
  PackOrderUseCase,
  ShipOrderUseCase,
  OutForDeliveryUseCase,
  DeliverOrderUseCase,
  UpdateOrderStatusUseCase,
} from '../../application/use-cases/order.use-cases';

const roleRepository = new RoleRepository();

export class OrderController {
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly getAllOrdersUseCase: GetAllOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    private readonly packOrderUseCase: PackOrderUseCase,
    private readonly shipOrderUseCase: ShipOrderUseCase,
    private readonly outForDeliveryUseCase: OutForDeliveryUseCase,
    private readonly deliverOrderUseCase: DeliverOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase
  ) {}

  private async checkIsAdmin(req: Request): Promise<boolean> {
    if (!req.user || !req.user.role) return false;
    try {
      const role = await roleRepository.findById(req.user.role);
      if (role && (role.name === 'admin' || role.name === 'super_admin' || role.hasPermission('manage_orders'))) {
        return true;
      }
    } catch (e) {
      // fallback false
    }
    return false;
  }

  placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const order = await this.placeOrderUseCase.execute({ userId, data: req.body });
      ApiResponse.success(res, order, 'Order placed successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = await this.checkIsAdmin(req);
      const query = {
        ...req.query,
        userId: (!isAdmin || (isAdmin && !req.query.all && !req.query.userId)) ? userId : req.query.userId,
        isAdmin,
      };
      const result = await this.getAllOrdersUseCase.execute(query);
      ApiResponse.success(res, result, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = await this.checkIsAdmin(req);
      const order = await this.getOrderByIdUseCase.execute({ id: req.params.id as string, userId, isAdmin });
      ApiResponse.success(res, order, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = await this.checkIsAdmin(req);
      const order = await this.cancelOrderUseCase.execute({ id: req.params.id as string, userId, isAdmin, data: req.body });
      ApiResponse.success(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  confirmOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.confirmOrderUseCase.execute({ id: req.params.id as string });
      ApiResponse.success(res, order, 'Order status updated to CONFIRMED');
    } catch (error) {
      next(error);
    }
  };

  packOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.packOrderUseCase.execute({ id: req.params.id as string });
      ApiResponse.success(res, order, 'Order status updated to PACKED');
    } catch (error) {
      next(error);
    }
  };

  shipOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.shipOrderUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, order, 'Order status updated to SHIPPED');
    } catch (error) {
      next(error);
    }
  };

  outForDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.outForDeliveryUseCase.execute({ id: req.params.id as string });
      ApiResponse.success(res, order, 'Order status updated to OUT_FOR_DELIVERY');
    } catch (error) {
      next(error);
    }
  };

  deliverOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.deliverOrderUseCase.execute({ id: req.params.id as string });
      ApiResponse.success(res, order, 'Order status updated to DELIVERED');
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.updateOrderStatusUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, order, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

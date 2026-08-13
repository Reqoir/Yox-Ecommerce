/**
 * @file return.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import {
  CreateReturnUseCase,
  GetUserReturnsUseCase,
  GetReturnByIdUseCase,
  ApproveReturnUseCase,
  RejectReturnUseCase,
  ScheduleReturnPickupUseCase,
  ReceiveReturnUseCase,
  InspectReturnUseCase,
  ProcessRefundDirectUseCase,
  GetAllReturnsUseCase,
} from '../../application/use-cases/return.use-cases';

export class ReturnController {
  constructor(
    private readonly createReturnUseCase: CreateReturnUseCase,
    private readonly getUserReturnsUseCase: GetUserReturnsUseCase,
    private readonly getReturnByIdUseCase: GetReturnByIdUseCase,
    private readonly approveReturnUseCase: ApproveReturnUseCase,
    private readonly rejectReturnUseCase: RejectReturnUseCase,
    private readonly scheduleReturnPickupUseCase: ScheduleReturnPickupUseCase,
    private readonly receiveReturnUseCase: ReceiveReturnUseCase,
    private readonly inspectReturnUseCase: InspectReturnUseCase,
    private readonly processRefundDirectUseCase: ProcessRefundDirectUseCase,
    private readonly getAllReturnsUseCase: GetAllReturnsUseCase
  ) {}

  createReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.createReturnUseCase.execute({ userId, data: req.body });
      ApiResponse.success(res, result, 'Return request submitted successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getUserReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const returns = await this.getUserReturnsUseCase.execute(userId);
      ApiResponse.success(res, returns, 'User returns retrieved');
    } catch (error) {
      next(error);
    }
  };

  getReturnById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
      const result = await this.getReturnByIdUseCase.execute({ id: req.params.id as string, userId, isAdmin });
      ApiResponse.success(res, result, 'Return details retrieved');
    } catch (error) {
      next(error);
    }
  };

  approveReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.approveReturnUseCase.execute(req.params.id as string);
      ApiResponse.success(res, result, 'Return approved');
    } catch (error) {
      next(error);
    }
  };

  rejectReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.rejectReturnUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, result, 'Return rejected');
    } catch (error) {
      next(error);
    }
  };

  schedulePickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.scheduleReturnPickupUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, result, 'Return pickup scheduled');
    } catch (error) {
      next(error);
    }
  };

  receiveReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.receiveReturnUseCase.execute(req.params.id as string);
      ApiResponse.success(res, result, 'Return marked as received');
    } catch (error) {
      next(error);
    }
  };

  inspectReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.inspectReturnUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, result, 'Return inspection recorded and inventory updated');
    } catch (error) {
      next(error);
    }
  };

  processRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.processRefundDirectUseCase.execute({ id: req.params.id as string, data: req.body });
      ApiResponse.success(res, result, 'Refund issued successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getAllReturnsUseCase.execute(req.query);
      ApiResponse.success(res, result, 'Returns list retrieved');
    } catch (error) {
      next(error);
    }
  };
}

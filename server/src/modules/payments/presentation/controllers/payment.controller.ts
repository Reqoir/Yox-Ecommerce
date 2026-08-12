/**
 * @file payment.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { ProcessRefundUseCase, GetRefundsByOrderUseCase } from '../../application/use-cases/refund.use-cases';

export class PaymentController {
  constructor(
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly getRefundsByOrderUseCase: GetRefundsByOrderUseCase
  ) {}

  processRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refund = await this.processRefundUseCase.execute(req.body);
      ApiResponse.success(res, refund, 'Refund processed successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getRefundsByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refunds = await this.getRefundsByOrderUseCase.execute(req.params.orderId as string);
      ApiResponse.success(res, refunds, 'Order refunds retrieved');
    } catch (error) {
      next(error);
    }
  };
}

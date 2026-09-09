/**
 * @file payment.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { ProcessRefundUseCase, GetRefundsByOrderUseCase } from '../../application/use-cases/refund.use-cases';
import { CreateRazorpayOrderUseCase, VerifyRazorpayPaymentUseCase } from '../../application/use-cases/payment.use-cases';

export class PaymentController {
  constructor(
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly getRefundsByOrderUseCase: GetRefundsByOrderUseCase,
    private readonly createRazorpayOrderUseCase?: CreateRazorpayOrderUseCase,
    private readonly verifyRazorpayPaymentUseCase?: VerifyRazorpayPaymentUseCase
  ) {}

  createRazorpayOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (!this.createRazorpayOrderUseCase) {
        throw new Error('CreateRazorpayOrderUseCase not injected');
      }

      const orderData = await this.createRazorpayOrderUseCase.execute({
        userId,
        ...req.body,
      });

      ApiResponse.success(res, orderData, 'Razorpay order created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  verifyRazorpayPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (!this.verifyRazorpayPaymentUseCase) {
        throw new Error('VerifyRazorpayPaymentUseCase not injected');
      }

      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required payment verification parameters',
        });
        return;
      }

      const verifiedOrder = await this.verifyRazorpayPaymentUseCase.execute({
        userId,
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      ApiResponse.success(res, verifiedOrder, 'Payment verified and order confirmed successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

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

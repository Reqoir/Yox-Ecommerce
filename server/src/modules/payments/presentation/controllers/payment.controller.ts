/**
 * @file payment.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { ProcessRefundUseCase, GetRefundsByOrderUseCase } from '../../application/use-cases/refund.use-cases';
import { CreateRazorpayOrderUseCase, VerifyRazorpayPaymentUseCase, RecordPaymentFailureUseCase } from '../../application/use-cases/payment.use-cases';
import { HandleRazorpayWebhookUseCase } from '../../application/use-cases/razorpay-webhook.use-case';
import {
  createRazorpayOrderSchema,
  failPaymentOrderSchema,
  processRefundSchema,
  verifyRazorpayPaymentSchema,
} from '../../application/validators/payment.validator';

export class PaymentController {
  constructor(
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly getRefundsByOrderUseCase: GetRefundsByOrderUseCase,
    private readonly createRazorpayOrderUseCase?: CreateRazorpayOrderUseCase,
    private readonly verifyRazorpayPaymentUseCase?: VerifyRazorpayPaymentUseCase,
    private readonly recordPaymentFailureUseCase?: RecordPaymentFailureUseCase,
    private readonly handleRazorpayWebhookUseCase?: HandleRazorpayWebhookUseCase
  ) {}

  handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.handleRazorpayWebhookUseCase) {
        throw new Error('HandleRazorpayWebhookUseCase not injected');
      }
      const signature = req.headers['x-razorpay-signature'] as string | undefined;
      const eventIdHeader = req.headers['x-razorpay-event-id'] as string | undefined;
      const rawBody = (req as any).rawBody;
      const result = await this.handleRazorpayWebhookUseCase.execute({
        rawBody,
        signature,
        eventIdHeader,
        payload: req.body,
      });
      ApiResponse.success(res, result, 'Razorpay webhook processed');
    } catch (error) {
      next(error);
    }
  };

  recordPaymentFailure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (!this.recordPaymentFailureUseCase) {
        throw new Error('RecordPaymentFailureUseCase not injected');
      }

      const parsed = failPaymentOrderSchema.parse(req.body);
      const result = await this.recordPaymentFailureUseCase.execute({
        userId,
        orderId: parsed.orderId,
        razorpayPaymentId: parsed.razorpayPaymentId,
        reason: parsed.reason,
      });

      ApiResponse.success(res, result, result.message || 'Payment failure recorded and stock restored');
    } catch (error) {
      next(error);
    }
  };

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

      const parsed = createRazorpayOrderSchema.parse(req.body);
      const orderData = await this.createRazorpayOrderUseCase.execute({
        userId,
        addressId: parsed.addressId,
        shippingAddress: parsed.shippingAddress,
        couponId: parsed.couponId ?? undefined,
        notes: parsed.notes ?? undefined,
        directBuyItem: parsed.directBuyItem,
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

      const parsed = verifyRazorpayPaymentSchema.parse(req.body);
      const verifiedOrder = await this.verifyRazorpayPaymentUseCase.execute({
        userId,
        orderId: parsed.orderId,
        razorpayOrderId: parsed.razorpayOrderId,
        razorpayPaymentId: parsed.razorpayPaymentId,
        razorpaySignature: parsed.razorpaySignature,
      });

      ApiResponse.success(res, verifiedOrder, 'Payment verified and order confirmed successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  processRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = processRefundSchema.parse(req.body);
      const refund = await this.processRefundUseCase.execute(parsed);
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

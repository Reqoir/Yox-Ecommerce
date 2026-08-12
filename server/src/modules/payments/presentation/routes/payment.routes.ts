/**
 * @file payment.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentRepository, RefundRepository } from '../../infrastructure/repositories/payment.repository';
import { ReturnRepository } from '../../../returns/infrastructure/repositories/return.repository';
import { OrderRepository } from '../../../orders/infrastructure/repositories/order.repository';
import { ProcessRefundUseCase, GetRefundsByOrderUseCase } from '../../application/use-cases/refund.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

const paymentRepo = new PaymentRepository();
const refundRepo = new RefundRepository();
const returnRepo = new ReturnRepository();
const orderRepo = new OrderRepository();

const processRefundUseCase = new ProcessRefundUseCase(refundRepo, paymentRepo, returnRepo, orderRepo);
const getRefundsByOrderUseCase = new GetRefundsByOrderUseCase(refundRepo);

const paymentController = new PaymentController(processRefundUseCase, getRefundsByOrderUseCase);

router.use(requireAuth);

router.get('/order/:orderId', paymentController.getRefundsByOrder);

const adminPermission = requirePermission('manage_orders');
router.post('/refund', adminPermission, paymentController.processRefund);

export { router as paymentRouter };

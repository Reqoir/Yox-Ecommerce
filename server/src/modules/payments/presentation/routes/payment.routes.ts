/**
 * @file payment.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentRepository, RefundRepository } from '../../infrastructure/repositories/payment.repository';
import { ReturnRepository } from '../../../returns/infrastructure/repositories/return.repository';
import { OrderRepository } from '../../../orders/infrastructure/repositories/order.repository';
import { CartRepository } from '../../../cart/infrastructure/repositories/cart.repository';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import { InventoryRepository } from '../../../inventory/infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../../inventory/infrastructure/repositories/stock-log.repository';
import { AddressRepository } from '../../../addresses/infrastructure/repositories/address.repository';
import { RazorpayService } from '../../infrastructure/services/razorpay.service';
import { ProcessRefundUseCase, GetRefundsByOrderUseCase } from '../../application/use-cases/refund.use-cases';
import { CreateRazorpayOrderUseCase, VerifyRazorpayPaymentUseCase } from '../../application/use-cases/payment.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// Repositories
const paymentRepo = new PaymentRepository();
const refundRepo = new RefundRepository();
const returnRepo = new ReturnRepository();
const orderRepo = new OrderRepository();
const cartRepo = new CartRepository();
const variantRepo = new ProductVariantRepository();
const inventoryRepo = new InventoryRepository();
const stockLogRepo = new StockLogRepository();
const addressRepo = new AddressRepository();

// Services
const razorpayService = new RazorpayService();

// Use Cases
const processRefundUseCase = new ProcessRefundUseCase(refundRepo, paymentRepo, returnRepo, orderRepo);
const getRefundsByOrderUseCase = new GetRefundsByOrderUseCase(refundRepo);
const createRazorpayOrderUseCase = new CreateRazorpayOrderUseCase(
  orderRepo,
  cartRepo,
  variantRepo,
  inventoryRepo,
  stockLogRepo,
  addressRepo,
  razorpayService
);
const verifyRazorpayPaymentUseCase = new VerifyRazorpayPaymentUseCase(
  orderRepo,
  cartRepo,
  razorpayService
);

// Controller
const paymentController = new PaymentController(
  processRefundUseCase,
  getRefundsByOrderUseCase,
  createRazorpayOrderUseCase,
  verifyRazorpayPaymentUseCase
);

// All payment routes require customer authentication
router.use(requireAuth);

// Customer Razorpay Routes
router.post('/create-order', paymentController.createRazorpayOrder);
router.post('/verify', paymentController.verifyRazorpayPayment);

// Order Refunds Retrieval
router.get('/order/:orderId', paymentController.getRefundsByOrder);

// Admin-Only Refund Processing
const adminPermission = requirePermission('manage_orders');
router.post('/refund', adminPermission, paymentController.processRefund);

export { router as paymentRouter };

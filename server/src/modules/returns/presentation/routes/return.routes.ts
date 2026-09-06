/**
 * @file return.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { ReturnController } from '../controllers/return.controller';
import { ReturnRepository } from '../../infrastructure/repositories/return.repository';
import { OrderRepository } from '../../../orders/infrastructure/repositories/order.repository';
import { InventoryRepository } from '../../../inventory/infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../../inventory/infrastructure/repositories/stock-log.repository';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import {
  CreateReturnUseCase,
  SubmitReturnShipmentUseCase,
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
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

const returnRepo = new ReturnRepository();
const orderRepo = new OrderRepository();
const inventoryRepo = new InventoryRepository();
const stockLogRepo = new StockLogRepository();
const variantRepo = new ProductVariantRepository();

const createReturnUseCase = new CreateReturnUseCase(returnRepo, orderRepo);
const submitReturnShipmentUseCase = new SubmitReturnShipmentUseCase(returnRepo);
const getUserReturnsUseCase = new GetUserReturnsUseCase(returnRepo);
const getReturnByIdUseCase = new GetReturnByIdUseCase(returnRepo);
const approveReturnUseCase = new ApproveReturnUseCase(returnRepo);
const rejectReturnUseCase = new RejectReturnUseCase(returnRepo);
const scheduleReturnPickupUseCase = new ScheduleReturnPickupUseCase(returnRepo);
const receiveReturnUseCase = new ReceiveReturnUseCase(returnRepo);
const inspectReturnUseCase = new InspectReturnUseCase(returnRepo, orderRepo, variantRepo, inventoryRepo, stockLogRepo);
const processRefundDirectUseCase = new ProcessRefundDirectUseCase(returnRepo);
const getAllReturnsUseCase = new GetAllReturnsUseCase(returnRepo);

const returnController = new ReturnController(
  createReturnUseCase,
  submitReturnShipmentUseCase,
  getUserReturnsUseCase,
  getReturnByIdUseCase,
  approveReturnUseCase,
  rejectReturnUseCase,
  scheduleReturnPickupUseCase,
  receiveReturnUseCase,
  inspectReturnUseCase,
  processRefundDirectUseCase,
  getAllReturnsUseCase
);

router.use(requireAuth);

// Admin / Staff endpoints (Must be declared BEFORE wildcard /:id routes)
const adminPermission = requirePermission('manage_orders');

router.get('/admin/all', adminPermission, returnController.getAllReturns);
router.patch('/admin/:id/approve', adminPermission, returnController.approveReturn);
router.patch('/admin/:id/reject', adminPermission, returnController.rejectReturn);
router.patch('/admin/:id/pickup', adminPermission, returnController.schedulePickup);
router.patch('/admin/:id/receive', adminPermission, returnController.receiveReturn);
router.patch('/admin/:id/inspect', adminPermission, returnController.inspectReturn);
router.patch('/admin/:id/refund', adminPermission, returnController.processRefund);

// Legacy admin routes (for backward compatibility)
router.patch('/:id/approve', adminPermission, returnController.approveReturn);
router.patch('/:id/reject', adminPermission, returnController.rejectReturn);
router.patch('/:id/pickup', adminPermission, returnController.schedulePickup);
router.patch('/:id/receive', adminPermission, returnController.receiveReturn);
router.patch('/:id/inspect', adminPermission, returnController.inspectReturn);
router.patch('/:id/refund', adminPermission, returnController.processRefund);

// Customer endpoints
router.post('/', returnController.createReturn);
router.get('/', returnController.getUserReturns);
router.get('/:id', returnController.getReturnById);
router.patch('/:id/ship', returnController.submitShipment);
router.post('/:id/ship', returnController.submitShipment);
router.put('/:id/ship', returnController.submitShipment);

export { router as returnRouter };

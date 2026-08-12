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
  GetUserReturnsUseCase,
  GetReturnByIdUseCase,
  ApproveReturnUseCase,
  RejectReturnUseCase,
  ScheduleReturnPickupUseCase,
  ReceiveReturnUseCase,
  InspectReturnUseCase,
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
const getUserReturnsUseCase = new GetUserReturnsUseCase(returnRepo);
const getReturnByIdUseCase = new GetReturnByIdUseCase(returnRepo);
const approveReturnUseCase = new ApproveReturnUseCase(returnRepo);
const rejectReturnUseCase = new RejectReturnUseCase(returnRepo);
const scheduleReturnPickupUseCase = new ScheduleReturnPickupUseCase(returnRepo);
const receiveReturnUseCase = new ReceiveReturnUseCase(returnRepo);
const inspectReturnUseCase = new InspectReturnUseCase(returnRepo, orderRepo, variantRepo, inventoryRepo, stockLogRepo);
const getAllReturnsUseCase = new GetAllReturnsUseCase(returnRepo);

const returnController = new ReturnController(
  createReturnUseCase,
  getUserReturnsUseCase,
  getReturnByIdUseCase,
  approveReturnUseCase,
  rejectReturnUseCase,
  scheduleReturnPickupUseCase,
  receiveReturnUseCase,
  inspectReturnUseCase,
  getAllReturnsUseCase
);

router.use(requireAuth);

// Customer endpoints
router.post('/', returnController.createReturn);
router.get('/', returnController.getUserReturns);
router.get('/:id', returnController.getReturnById);

// Admin / Staff endpoints
const adminPermission = requirePermission('manage_orders');

router.get('/admin/all', adminPermission, returnController.getAllReturns);
router.patch('/:id/approve', adminPermission, returnController.approveReturn);
router.patch('/:id/reject', adminPermission, returnController.rejectReturn);
router.patch('/:id/pickup', adminPermission, returnController.schedulePickup);
router.patch('/:id/receive', adminPermission, returnController.receiveReturn);
router.patch('/:id/inspect', adminPermission, returnController.inspectReturn);

export { router as returnRouter };

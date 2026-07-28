/**
 * @file inventory.routes.ts
 * @layer Presentation › Routes
 *
 * Route Security Summary:
 *   Public (no auth):         GET /          — browse inventory (for product pages)
 *                             GET /:id       — get single inventory record
 *   Auth (logged-in user):    POST /:id/reserve  — lock stock when adding to checkout
 *                             POST /:id/release  — unlock stock if order cancelled
 *   Admin (manage_inventory): PATCH /:id         — update warehouse info / threshold
 *                             POST /:id/adjust   — manual stock correction
 *                             GET /:id/logs      — audit trail
 *                             GET /low-stock     — items below alert threshold
 */

import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import {
  GetAllInventoryUseCase,
  GetInventoryByIdUseCase,
  UpdateInventoryUseCase,
  AdjustStockUseCase,
  ReserveStockUseCase,
  ReleaseStockUseCase,
  GetStockLogsUseCase,
  GetLowStockUseCase,
} from '../../application/use-cases/inventory.use-cases';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../infrastructure/repositories/stock-log.repository';
import { NotificationRepository } from '../../../notifications/infrastructure/repositories/notification.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// Instantiate Repositories
const inventoryRepo = new InventoryRepository();
const stockLogRepo = new StockLogRepository();
const notificationRepo = new NotificationRepository();

// Instantiate Use Cases
const getAllInventoryUseCase = new GetAllInventoryUseCase(inventoryRepo);
const getInventoryByIdUseCase = new GetInventoryByIdUseCase(inventoryRepo);
const updateInventoryUseCase = new UpdateInventoryUseCase(inventoryRepo);
const adjustStockUseCase = new AdjustStockUseCase(inventoryRepo, stockLogRepo, notificationRepo);
const reserveStockUseCase = new ReserveStockUseCase(inventoryRepo, stockLogRepo, notificationRepo);
const releaseStockUseCase = new ReleaseStockUseCase(inventoryRepo, stockLogRepo);
const getStockLogsUseCase = new GetStockLogsUseCase(stockLogRepo);
const getLowStockUseCase = new GetLowStockUseCase(inventoryRepo);

// Instantiate Controller
const inventoryController = new InventoryController(
  getAllInventoryUseCase,
  getInventoryByIdUseCase,
  updateInventoryUseCase,
  adjustStockUseCase,
  reserveStockUseCase,
  releaseStockUseCase,
  getStockLogsUseCase,
  getLowStockUseCase
);

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', inventoryController.getAll);

// ── Admin-only Routes (must be before /:id to avoid param conflicts) ──────────
router.get('/low-stock', requireAuth, requirePermission('manage_inventory'), inventoryController.getLowStock);

// ── Public single-item route ───────────────────────────────────────────────────
router.get('/:id', inventoryController.getById);

// ── Auth-required Routes (any logged-in user — for checkout flow) ──────────────
router.post('/:id/reserve', requireAuth, inventoryController.reserve);
router.post('/:id/release', requireAuth, inventoryController.release);

// ── Admin-only Routes ──────────────────────────────────────────────────────────
router.patch('/:id', requireAuth, requirePermission('manage_inventory'), inventoryController.update);
router.post('/:id/adjust', requireAuth, requirePermission('manage_inventory'), inventoryController.adjustStock);
router.get('/:id/logs', requireAuth, requirePermission('manage_inventory'), inventoryController.getLogs);

export { router as inventoryRouter };

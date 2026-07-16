/**
 * @file inventory.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { 
  GetAllInventoryUseCase, 
  GetInventoryByIdUseCase, 
  UpdateInventoryUseCase, 
  AdjustStockUseCase,
  GetStockLogsUseCase
} from '../../application/use-cases/inventory.use-cases';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../infrastructure/repositories/stock-log.repository';

const router = Router();

// Instantiate Repositories
const inventoryRepo = new InventoryRepository();
const stockLogRepo = new StockLogRepository();

// Instantiate Use Cases
const getAllInventoryUseCase = new GetAllInventoryUseCase(inventoryRepo);
const getInventoryByIdUseCase = new GetInventoryByIdUseCase(inventoryRepo);
const updateInventoryUseCase = new UpdateInventoryUseCase(inventoryRepo);
const adjustStockUseCase = new AdjustStockUseCase(inventoryRepo, stockLogRepo);
const getStockLogsUseCase = new GetStockLogsUseCase(stockLogRepo);

// Instantiate Controller
const inventoryController = new InventoryController(
  getAllInventoryUseCase,
  getInventoryByIdUseCase,
  updateInventoryUseCase,
  adjustStockUseCase,
  getStockLogsUseCase
);

// Define Routes
router.get('/', inventoryController.getAll);
router.get('/:id', inventoryController.getById);
router.patch('/:id', inventoryController.update);
router.post('/:id/adjust', inventoryController.adjustStock);
router.get('/:id/logs', inventoryController.getLogs);

export { router as inventoryRouter };

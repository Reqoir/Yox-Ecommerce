/**
 * @file shipment.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';
import { ShipmentRepository } from '../../infrastructure/repositories/shipment.repository';
import { OrderRepository } from '../../../orders/infrastructure/repositories/order.repository';
import {
  CreateShipmentUseCase,
  GetShipmentByIdUseCase,
  GetShipmentByOrderUseCase,
  TrackShipmentUseCase,
  UpdateShipmentStatusUseCase,
  GetAllShipmentsUseCase,
} from '../../application/use-cases/shipment.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

const shipmentRepo = new ShipmentRepository();
const orderRepo = new OrderRepository();

const createShipmentUseCase = new CreateShipmentUseCase(shipmentRepo, orderRepo);
const getShipmentByIdUseCase = new GetShipmentByIdUseCase(shipmentRepo);
const getShipmentByOrderUseCase = new GetShipmentByOrderUseCase(shipmentRepo);
const trackShipmentUseCase = new TrackShipmentUseCase(shipmentRepo, orderRepo);
const updateShipmentStatusUseCase = new UpdateShipmentStatusUseCase(shipmentRepo, orderRepo);
const getAllShipmentsUseCase = new GetAllShipmentsUseCase(shipmentRepo);

const shipmentController = new ShipmentController(
  createShipmentUseCase,
  getShipmentByIdUseCase,
  getShipmentByOrderUseCase,
  trackShipmentUseCase,
  updateShipmentStatusUseCase,
  getAllShipmentsUseCase
);

// Public tracking
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Authenticated customer/staff routes
router.use(requireAuth);
router.get('/order/:orderId', shipmentController.getShipmentByOrder);
router.get('/:id', shipmentController.getShipmentById);

// Admin-only management routes
const adminPermission = requirePermission('manage_orders');
router.get('/', adminPermission, shipmentController.getAllShipments);
router.post('/', adminPermission, shipmentController.createShipment);
router.patch('/:id/status', adminPermission, shipmentController.updateStatus);

export { router as shipmentRouter };

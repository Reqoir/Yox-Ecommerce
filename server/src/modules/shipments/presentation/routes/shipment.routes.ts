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
  SyncCourierStatusUseCase,
  GenerateShipmentLabelUseCase,
  GenerateShipmentInvoiceUseCase,
  HandleShiprocketWebhookUseCase,
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
const syncCourierStatusUseCase = new SyncCourierStatusUseCase(shipmentRepo, orderRepo);
const generateShipmentLabelUseCase = new GenerateShipmentLabelUseCase(shipmentRepo, orderRepo);
const generateShipmentInvoiceUseCase = new GenerateShipmentInvoiceUseCase(shipmentRepo, orderRepo);
const handleShiprocketWebhookUseCase = new HandleShiprocketWebhookUseCase(shipmentRepo, orderRepo);

const shipmentController = new ShipmentController(
  createShipmentUseCase,
  getShipmentByIdUseCase,
  getShipmentByOrderUseCase,
  trackShipmentUseCase,
  updateShipmentStatusUseCase,
  getAllShipmentsUseCase,
  syncCourierStatusUseCase,
  generateShipmentLabelUseCase,
  generateShipmentInvoiceUseCase,
  handleShiprocketWebhookUseCase
);

// Public routes: Tracking and Shiprocket Webhook
router.get('/track/:trackingNumber', shipmentController.trackShipment);
router.post('/webhook/shiprocket', shipmentController.handleShiprocketWebhook);

// Authenticated customer/staff routes
router.use(requireAuth);
router.get('/order/:orderId', shipmentController.getShipmentByOrder);
router.get('/order/:orderId/sync', shipmentController.syncCourierStatus);
router.get('/order/:orderId/invoice', shipmentController.generateInvoice);
router.post('/:orderId/invoice', shipmentController.generateInvoice);
router.get('/:id', shipmentController.getShipmentById);

// Admin-only management routes
const adminPermission = requirePermission('manage_orders');
router.get('/', adminPermission, shipmentController.getAllShipments);
router.post('/', adminPermission, shipmentController.createShipment);
router.patch('/:id/status', adminPermission, shipmentController.updateStatus);
router.post('/:orderId/sync-courier', adminPermission, shipmentController.syncCourierStatus);
router.post('/:orderId/label', adminPermission, shipmentController.generateLabel);

export { router as shipmentRouter };

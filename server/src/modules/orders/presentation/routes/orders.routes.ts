/**
 * @file orders.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { CartRepository } from '../../../cart/infrastructure/repositories/cart.repository';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import { InventoryRepository } from '../../../inventory/infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../../inventory/infrastructure/repositories/stock-log.repository';
import { AddressRepository } from '../../../addresses/infrastructure/repositories/address.repository';
import {
  PlaceOrderUseCase,
  GetAllOrdersUseCase,
  GetOrderByIdUseCase,
  CancelOrderUseCase,
  ConfirmOrderUseCase,
  PackOrderUseCase,
  ShipOrderUseCase,
  OutForDeliveryUseCase,
  DeliverOrderUseCase,
  UpdateOrderStatusUseCase,
} from '../../application/use-cases/order.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// 1. Instantiate Repositories
const orderRepo = new OrderRepository();
const cartRepo = new CartRepository();
const variantRepo = new ProductVariantRepository();
const inventoryRepo = new InventoryRepository();
const stockLogRepo = new StockLogRepository();
const addressRepo = new AddressRepository();

// 2. Instantiate Use Cases
const placeOrderUseCase = new PlaceOrderUseCase(orderRepo, cartRepo, variantRepo, inventoryRepo, stockLogRepo, addressRepo);
const getAllOrdersUseCase = new GetAllOrdersUseCase(orderRepo);
const getOrderByIdUseCase = new GetOrderByIdUseCase(orderRepo);
const cancelOrderUseCase = new CancelOrderUseCase(orderRepo, variantRepo, inventoryRepo, stockLogRepo);
const confirmOrderUseCase = new ConfirmOrderUseCase(orderRepo);
const packOrderUseCase = new PackOrderUseCase(orderRepo);
const shipOrderUseCase = new ShipOrderUseCase(orderRepo);
const outForDeliveryUseCase = new OutForDeliveryUseCase(orderRepo);
const deliverOrderUseCase = new DeliverOrderUseCase(orderRepo, inventoryRepo, stockLogRepo);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepo);

// 3. Instantiate Controller
const orderController = new OrderController(
  placeOrderUseCase,
  getAllOrdersUseCase,
  getOrderByIdUseCase,
  cancelOrderUseCase,
  confirmOrderUseCase,
  packOrderUseCase,
  shipOrderUseCase,
  outForDeliveryUseCase,
  deliverOrderUseCase,
  updateOrderStatusUseCase
);

// ── User & General Protected Routes ──────────────────────────────────────────
router.use(requireAuth);

router.post('/', orderController.placeOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

// ── Admin-Only State Machine Routes ──────────────────────────────────────────
const adminPermission = requirePermission('manage_orders');

router.patch('/:id/confirm', adminPermission, orderController.confirmOrder);
router.patch('/:id/pack', adminPermission, orderController.packOrder);
router.patch('/:id/ship', adminPermission, orderController.shipOrder);
router.patch('/:id/out-for-delivery', adminPermission, orderController.outForDelivery);
router.patch('/:id/deliver', adminPermission, orderController.deliverOrder);
router.patch('/:id/status', adminPermission, orderController.updateStatus);

export { router as ordersRouter };

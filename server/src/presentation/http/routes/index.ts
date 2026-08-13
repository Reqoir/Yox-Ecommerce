/**
 * @file index.ts
 * @layer Presentation › HTTP › Routes
 *
 * Root API router.
 * Only a health check endpoint is registered here.
 * All feature module routes will be added as modules are implemented.
 *
 * Pattern for adding a new module route:
 *   import { authRouter } from '@modules/auth/presentation/routes/auth.routes';
 *   router.use('/auth', authRouter);
 */

import { Router, type Request, type Response } from 'express';
import authRouter from '../../../modules/auth/presentation/routes/auth.routes';
import { productRoutes } from '../../../modules/products/presentation/routes/product.routes';
import { productVariantRoutes } from '../../../modules/products/presentation/routes/product-variant.routes';

import { getMongooseState } from '../../../core/infrastructure/database/mongoose/connection';
import { isRedisConnected } from '../../../core/infrastructure/database/redis/connection';
import { ApiResponse } from '../../../shared/utils/api-response.util';
import { APP_NAME } from '../../../shared/constants/app.constants';

export const rootRouter = Router();

/**
 * GET /api/v1/health
 * Health check endpoint — returns service status for DB and Redis.
 */
rootRouter.get('/health', (_req: Request, res: Response) => {
  ApiResponse.success(res, {
    service: APP_NAME,
    status: 'operational',
    environment: process.env['NODE_ENV'] ?? 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: getMongooseState(),
      redis: isRedisConnected() ? 'connected' : 'disconnected',
    },
  });
});

import userRouter from '../../../modules/users/presentation/routes/user.routes';
import { categoryRoutes } from '../../../modules/categories/presentation/routes/category.routes';
import { brandRoutes } from '../../../modules/brands/presentation/routes/brand.routes';
import { inventoryRouter } from '../../../modules/inventory/presentation/routes/inventory.routes';
import { roleRoutes } from '../../../modules/roles/presentation/routes/role.routes';
import { uploadRouter } from '../../../modules/upload/presentation/routes/upload.routes';
import { addressRouter } from '../../../modules/addresses/presentation/routes/address.routes';
import { cartRouter } from '../../../modules/cart/presentation/routes/cart.routes';
import { checkoutRouter } from '../../../modules/checkout/presentation/routes/checkout.routes';
import { notificationsRouter } from '../../../modules/notifications/presentation/routes/notification.routes';
import { ordersRouter } from '../../../modules/orders/presentation/routes/orders.routes';
import { analyticsRouter } from '../../../modules/analytics/presentation/routes/analytics.routes';
import { reportsRouter } from '../../../modules/reports/presentation/routes/reports.routes';

import { shipmentRouter } from '../../../modules/shipments/presentation/routes/shipment.routes';
import { returnRouter } from '../../../modules/returns/presentation/routes/return.routes';
import { paymentRouter } from '../../../modules/payments/presentation/routes/payment.routes';
import { auditLogRouter } from '../../../modules/audit-logs/presentation/routes/audit-log.routes';
import { paymentReportRouter } from '../../../modules/payment-reports/presentation/routes/payment-report.routes';

rootRouter.use('/auth', authRouter);
rootRouter.use('/users', userRouter);
rootRouter.use('/products', productRoutes);
rootRouter.use('/product-variants', productVariantRoutes);
rootRouter.use('/categories', categoryRoutes);
rootRouter.use('/brands', brandRoutes);
rootRouter.use('/inventory', inventoryRouter);
rootRouter.use('/roles', roleRoutes);
rootRouter.use('/addresses', addressRouter);
rootRouter.use('/upload', uploadRouter);
rootRouter.use('/cart', cartRouter);
rootRouter.use('/checkout', checkoutRouter);
rootRouter.use('/notifications', notificationsRouter);
rootRouter.use('/orders', ordersRouter);
rootRouter.use('/analytics', analyticsRouter);
rootRouter.use('/reports', reportsRouter);
rootRouter.use('/shipments', shipmentRouter);
rootRouter.use('/returns', returnRouter);
rootRouter.use('/payments', paymentRouter);
rootRouter.use('/audit-logs', auditLogRouter);
rootRouter.use('/payment-reports', paymentReportRouter);




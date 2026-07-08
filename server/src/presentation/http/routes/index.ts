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

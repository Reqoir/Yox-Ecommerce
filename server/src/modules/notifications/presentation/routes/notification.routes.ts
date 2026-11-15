/**
 * @file notification.routes.ts
 * @layer Presentation › Routes
 *
 * All notification routes require authentication.
 * The requesting user's ID is read from the verified JWT — no spoofing possible.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationRepository } from '../../infrastructure/repositories/notification.repository';
import {
  GetNotificationsUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  MarkManyNotificationsReadUseCase,
  DeleteNotificationUseCase,
  DeleteManyNotificationsUseCase,
  DeleteAllNotificationsUseCase,
} from '../../application/use-cases/notification.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { getRedisClient } from '../../../../core/infrastructure/database/redis/client';
import { ApiError } from '../../../../shared/utils/api-error.util';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';

const router = Router();

// All notification endpoints require a logged-in user
router.use(requireAuth);

// Instantiate Repositories
const notificationRepo = new NotificationRepository();

// Instantiate Use Cases
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
const markReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
const markAllReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);
const markManyReadUseCase = new MarkManyNotificationsReadUseCase(notificationRepo);
const deleteUseCase = new DeleteNotificationUseCase(notificationRepo);
const deleteManyUseCase = new DeleteManyNotificationsUseCase(notificationRepo);
const deleteAllUseCase = new DeleteAllNotificationsUseCase(notificationRepo);

// Instantiate Controller
const controller = new NotificationController(
  getNotificationsUseCase,
  markReadUseCase,
  markAllReadUseCase,
  markManyReadUseCase,
  deleteUseCase,
  deleteManyUseCase,
  deleteAllUseCase
);

// Short-lived single-use ticket for SSE connection (expires in 30 seconds)
router.post('/ticket', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required to generate an SSE ticket');
    }
    const ticket = crypto.randomUUID();
    const redis = getRedisClient();
    await redis.set(`sse_ticket:${ticket}`, req.user.id, 'EX', 30);
    ApiResponse.success(res, { ticket }, 'SSE ticket generated successfully', HttpStatus.OK);
  } catch (error) {
    next(error);
  }
});

// SSE stream endpoint — must be before /:id routes to avoid conflict
router.get('/stream', controller.streamNotifications);

// Routes (order matters — static routes before /:id to prevent conflict)
router.get('/', controller.getAll);
router.patch('/read-all', controller.markAllRead);
router.patch('/bulk-read', controller.markManyRead);
router.patch('/:id/read', controller.markRead);
router.delete('/delete-all', controller.deleteAll);
router.delete('/bulk-delete', controller.bulkDelete);
router.delete('/:id', controller.delete);

export { router as notificationsRouter };

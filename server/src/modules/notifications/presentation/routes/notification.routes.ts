/**
 * @file notification.routes.ts
 * @layer Presentation › Routes
 *
 * All notification routes require authentication.
 * The requesting user's ID is read from the verified JWT — no spoofing possible.
 */

import { Router } from 'express';
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

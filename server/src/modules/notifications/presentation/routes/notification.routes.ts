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
  DeleteNotificationUseCase,
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
const deleteUseCase = new DeleteNotificationUseCase(notificationRepo);

// Instantiate Controller
const controller = new NotificationController(
  getNotificationsUseCase,
  markReadUseCase,
  markAllReadUseCase,
  deleteUseCase
);

// Routes (order matters — /read-all before /:id to prevent conflict)
router.get('/', controller.getAll);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
router.delete('/:id', controller.delete);

export { router as notificationsRouter };

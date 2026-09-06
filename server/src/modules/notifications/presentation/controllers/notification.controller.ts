/**
 * @file notification.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  GetNotificationsUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  MarkManyNotificationsReadUseCase,
  DeleteNotificationUseCase,
  DeleteManyNotificationsUseCase,
  DeleteAllNotificationsUseCase,
} from '../../application/use-cases/notification.use-cases';
import { notificationListQuerySchema } from '../validators/notification.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';
import { NotificationStreamService } from '../../infrastructure/services/notification-stream.service';

export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly markManyReadUseCase: MarkManyNotificationsReadUseCase,
    private readonly deleteUseCase: DeleteNotificationUseCase,
    private readonly deleteManyUseCase: DeleteManyNotificationsUseCase,
    private readonly deleteAllUseCase: DeleteAllNotificationsUseCase
  ) {}

  /**
   * GET /notifications/stream
   * Server-Sent Events endpoint for real-time notifications.
   * Client subscribes once; server pushes events whenever they occur.
   */
  public streamNotifications = (req: Request, res: Response): void => {
    const userId = req.user!.id;
    const clientId = randomUUID();

    const cleanup = NotificationStreamService.getInstance().addClient(clientId, userId, res);

    // Clean up on client disconnect
    req.on('close', cleanup);
    req.on('error', cleanup);
  };

  /**
   * GET /notifications
   * For a regular user: returns their notifications + broadcasts.
   * For an admin (no userId on route, uses req.user.id from token): same logic applies.
   * The frontend decides whether to use this as "user bell" or "admin alerts panel".
   */
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validQuery = validateRequest(req, notificationListQuerySchema as any, 'query');
      const result = await this.getNotificationsUseCase.execute({ userId, query: validQuery });
      ApiResponse.success(res, result, 'Notifications retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /notifications/:id/read */
  public markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await this.markReadUseCase.execute({ id, userId });
      ApiResponse.success(res, result, 'Notification marked as read', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /notifications/read-all */
  public markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.markAllReadUseCase.execute({ userId });
      ApiResponse.success(res, null, 'All notifications marked as read', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /notifications/bulk-read */
  public markManyRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      if (Array.isArray(ids) && ids.length > 0) {
        await this.markManyReadUseCase.execute({ ids });
      }
      ApiResponse.success(res, null, 'Selected notifications marked as read', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /notifications/bulk-delete */
  public bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      if (Array.isArray(ids) && ids.length > 0) {
        await this.deleteManyUseCase.execute({ ids });
      }
      ApiResponse.success(res, null, 'Selected notifications deleted', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /notifications/delete-all */
  public deleteAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.deleteAllUseCase.execute({ userId });
      ApiResponse.success(res, null, 'All notifications deleted', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /notifications/:id */
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const isAdmin = false;
      await this.deleteUseCase.execute({ id, userId, isAdmin });
      ApiResponse.success(res, null, 'Notification deleted', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

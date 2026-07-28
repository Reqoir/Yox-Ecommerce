/**
 * @file notification.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import {
  GetNotificationsUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  DeleteNotificationUseCase,
} from '../../application/use-cases/notification.use-cases';
import { notificationListQuerySchema } from '../validators/notification.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly deleteUseCase: DeleteNotificationUseCase
  ) {}

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

  /** DELETE /notifications/:id */
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      // The role field from JWT is the roleId — for simplicity we pass isAdmin=false
      // and let the use case check ownership. Admins can use the manage_inventory permission route.
      const isAdmin = false;
      await this.deleteUseCase.execute({ id, userId, isAdmin });
      ApiResponse.success(res, null, 'Notification deleted', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

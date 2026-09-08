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
import { NotificationType } from '../../domain/entities/notification.entity';
import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';
import { UserModel } from '../../../users/infrastructure/models/user.model';

export class NotificationController {
  private readonly roleRepo = new RoleRepository();

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
   * Helper to resolve the authenticated caller's permissions and compute
   * which broadcast notification types they are allowed to see.
   */
  private async resolveUserPermissions(req: Request): Promise<{
    permissions: string[];
    isAdmin: boolean;
    allowedTypes: NotificationType[];
  }> {
    const userRoleStr = String(req.user?.role || '').toLowerCase();

    // Check if user has direct admin role string
    if (userRoleStr === 'admin' || userRoleStr === 'super_admin' || userRoleStr.includes('admin')) {
      const allTypes: NotificationType[] = [
        'LOW_STOCK',
        'ORDER_STATUS',
        'SYSTEM',
        'NEW_ORDER',
        'ORDER_CANCELLED',
        'RETURN_REQUEST',
        'NEW_REVIEW',
        'NEW_USER',
      ];
      return { permissions: ['*'], isAdmin: true, allowedTypes: allTypes };
    }

    let permissions: string[] = [];
    let isAdmin = false;

    try {
      let roleId = req.user?.role;
      // If roleId is missing or default string, fetch actual roleId from user document
      if (!roleId || roleId === 'CUSTOMER_ROLE_ID') {
        const userDoc = await UserModel.findById(req.user?.id).select('roleId').lean();
        if (userDoc?.roleId) roleId = String(userDoc.roleId);
      }

      if (roleId) {
        const role = await this.roleRepo.findById(roleId);
        if (role) {
          permissions = role.permissions || [];
          if (
            role.name.toLowerCase().includes('admin') ||
            permissions.includes('*') ||
            permissions.includes('manage_notifications')
          ) {
            isAdmin = true;
          }
        }
      }
    } catch {
      // Ignore lookup errors, fallback to empty
    }

    if (isAdmin) {
      const allTypes: NotificationType[] = [
        'LOW_STOCK',
        'ORDER_STATUS',
        'SYSTEM',
        'NEW_ORDER',
        'ORDER_CANCELLED',
        'RETURN_REQUEST',
        'NEW_REVIEW',
        'NEW_USER',
      ];
      return { permissions, isAdmin: true, allowedTypes: allTypes };
    }

    const allowedTypes: NotificationType[] = [];
    if (permissions.includes('manage_orders')) {
      allowedTypes.push('NEW_ORDER', 'ORDER_CANCELLED', 'ORDER_STATUS', 'RETURN_REQUEST');
    }
    if (permissions.includes('manage_inventory')) {
      allowedTypes.push('LOW_STOCK');
    }
    if (permissions.includes('manage_reviews')) {
      allowedTypes.push('NEW_REVIEW');
    }
    if (permissions.includes('manage_users')) {
      allowedTypes.push('NEW_USER');
    }
    if (permissions.length > 0) {
      allowedTypes.push('SYSTEM');
    }

    return { permissions, isAdmin, allowedTypes };
  }

  /**
   * GET /notifications/stream
   * Server-Sent Events endpoint for real-time notifications.
   * Client subscribes once; server pushes permitted events whenever they occur.
   */
  public streamNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const clientId = randomUUID();

    const { permissions, isAdmin } = await this.resolveUserPermissions(req);

    const cleanup = NotificationStreamService.getInstance().addClient(
      clientId,
      userId,
      res,
      permissions,
      isAdmin
    );

    // Clean up on client disconnect
    req.on('close', cleanup);
    req.on('error', cleanup);
  };

  /**
   * GET /notifications
   * Returns notifications permitted for the caller:
   * - user-specific notifications targeted to req.user.id
   * - broadcast notifications filtered by the user's role/permissions
   */
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validQuery = validateRequest(req, notificationListQuerySchema as any, 'query');
      const { allowedTypes } = await this.resolveUserPermissions(req);

      const result = await this.getNotificationsUseCase.execute({
        userId,
        query: validQuery,
        allowedTypes,
      });
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
      const { allowedTypes } = await this.resolveUserPermissions(req);
      await this.markAllReadUseCase.execute({ userId, allowedTypes });
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
      const { allowedTypes } = await this.resolveUserPermissions(req);
      await this.deleteAllUseCase.execute({ userId, allowedTypes });
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
      const { isAdmin } = await this.resolveUserPermissions(req);
      await this.deleteUseCase.execute({ id, userId, isAdmin });
      ApiResponse.success(res, null, 'Notification deleted', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

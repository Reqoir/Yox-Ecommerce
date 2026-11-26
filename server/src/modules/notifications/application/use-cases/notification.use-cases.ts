/**
 * @file notification.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ForbiddenError } from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification, NotificationType } from '../../domain/entities/notification.entity';
import {
  CreateNotificationRequestDTO,
  NotificationResponseDTO,
} from '../dtos/notification.dto';

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapToResponseDTO(n: Notification): NotificationResponseDTO {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    metadata: n.metadata,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

/** Internal use case — called server-side (e.g. from inventory use cases) */
export class CreateNotificationUseCase
  implements IUseCase<CreateNotificationRequestDTO, NotificationResponseDTO>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(data: CreateNotificationRequestDTO): Promise<NotificationResponseDTO> {
    const notification = Notification.create(data);
    const saved = await this.notificationRepo.save(notification);
    return mapToResponseDTO(saved);
  }
}

export class GetNotificationsUseCase
  implements
    IUseCase<
      { userId: string | null; query: any; allowedTypes?: NotificationType[] },
      { data: NotificationResponseDTO[]; total: number; unreadCount: number }
    >
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    userId: string | null;
    query: any;
    allowedTypes?: NotificationType[];
  }): Promise<{ data: NotificationResponseDTO[]; total: number; unreadCount: number }> {
    const [result, unreadCount] = await Promise.all([
      this.notificationRepo.findForUser(input.userId, input.query, input.allowedTypes),
      this.notificationRepo.countUnread(input.userId, input.allowedTypes),
    ]);

    return {
      data: result.data.map(mapToResponseDTO),
      total: result.total,
      unreadCount,
    };
  }
}

export class MarkNotificationReadUseCase
  implements
    IUseCase<
      { id: string; userId: string | null; isAdmin?: boolean },
      NotificationResponseDTO
    >
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    id: string;
    userId: string | null;
    isAdmin?: boolean;
  }): Promise<NotificationResponseDTO> {
    const notification = await this.notificationRepo.findById(input.id);
    if (!notification) throw new NotFoundError('Notification not found');

    // Security: regular users can only mark their own notifications as read;
    // broadcast notifications (userId === null) require admin/staff context
    if (notification.userId === null) {
      if (!input.isAdmin) {
        throw new ForbiddenError('Not authorised to mark this notification as read');
      }
    } else if (!input.userId || notification.userId !== input.userId) {
      if (!input.isAdmin) {
        throw new ForbiddenError('Not authorised to mark this notification as read');
      }
    }

    notification.markAsRead();
    const saved = await this.notificationRepo.save(notification);
    return mapToResponseDTO(saved);
  }
}

export class MarkAllNotificationsReadUseCase
  implements IUseCase<{ userId: string | null; allowedTypes?: NotificationType[] }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: { userId: string | null; allowedTypes?: NotificationType[] }): Promise<void> {
    await this.notificationRepo.markAllRead(input.userId, input.allowedTypes);
  }
}

export class MarkManyNotificationsReadUseCase
  implements IUseCase<{ ids: string[]; userId: string | null; allowedTypes?: NotificationType[] }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    ids: string[];
    userId: string | null;
    allowedTypes?: NotificationType[];
  }): Promise<void> {
    await this.notificationRepo.markManyRead(input.ids, input.userId, input.allowedTypes);
  }
}

export class DeleteNotificationUseCase
  implements IUseCase<{ id: string; userId: string | null; isAdmin: boolean }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    id: string;
    userId: string | null;
    isAdmin: boolean;
  }): Promise<void> {
    const notification = await this.notificationRepo.findById(input.id);
    if (!notification) throw new NotFoundError('Notification not found');

    // Only the owner can delete user-specific notifications; only admins can delete broadcast (null) notifications
    if (notification.userId === null) {
      if (!input.isAdmin) {
        throw new ForbiddenError('Not authorised to delete this notification');
      }
    } else if (!input.isAdmin && (!input.userId || notification.userId !== input.userId)) {
      throw new ForbiddenError('Not authorised to delete this notification');
    }

    await this.notificationRepo.delete(input.id);
  }
}

export class DeleteManyNotificationsUseCase
  implements IUseCase<{ ids: string[]; userId: string | null; allowedTypes?: NotificationType[] }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    ids: string[];
    userId: string | null;
    allowedTypes?: NotificationType[];
  }): Promise<void> {
    await this.notificationRepo.deleteMany(input.ids, input.userId, input.allowedTypes);
  }
}

export class DeleteAllNotificationsUseCase
  implements IUseCase<{ userId: string | null; allowedTypes?: NotificationType[] }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: { userId: string | null; allowedTypes?: NotificationType[] }): Promise<void> {
    await this.notificationRepo.deleteAll(input.userId, input.allowedTypes);
  }
}

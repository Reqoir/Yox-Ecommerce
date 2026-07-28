/**
 * @file notification.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
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
      { userId: string | null; query: any },
      { data: NotificationResponseDTO[]; total: number; unreadCount: number }
    >
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    userId: string | null;
    query: any;
  }): Promise<{ data: NotificationResponseDTO[]; total: number; unreadCount: number }> {
    const [result, unreadCount] = await Promise.all([
      this.notificationRepo.findForUser(input.userId, input.query),
      this.notificationRepo.countUnread(input.userId),
    ]);

    return {
      data: result.data.map(mapToResponseDTO),
      total: result.total,
      unreadCount,
    };
  }
}

export class MarkNotificationReadUseCase
  implements IUseCase<{ id: string; userId: string | null }, NotificationResponseDTO>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: {
    id: string;
    userId: string | null;
  }): Promise<NotificationResponseDTO> {
    const notification = await this.notificationRepo.findById(input.id);
    if (!notification) throw new Error('Notification not found');

    // Security: a regular user can only mark their own or broadcast notifications as read
    if (
      notification.userId !== null &&
      input.userId !== null &&
      notification.userId !== input.userId
    ) {
      throw new Error('Not authorised to mark this notification as read');
    }

    notification.markAsRead();
    const saved = await this.notificationRepo.save(notification);
    return mapToResponseDTO(saved);
  }
}

export class MarkAllNotificationsReadUseCase
  implements IUseCase<{ userId: string | null }, void>
{
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(input: { userId: string | null }): Promise<void> {
    await this.notificationRepo.markAllRead(input.userId);
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
    if (!notification) throw new Error('Notification not found');

    // Only the owner or an admin can delete
    if (
      !input.isAdmin &&
      notification.userId !== null &&
      notification.userId !== input.userId
    ) {
      throw new Error('Not authorised to delete this notification');
    }

    await this.notificationRepo.delete(input.id);
  }
}

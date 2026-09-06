/**
 * @file notification.service.ts
 * @layer Application › Services
 *
 * Application-level service for creating and broadcasting notifications.
 * Persists to DB via NotificationRepository and broadcasts via SSE stream.
 */

import { NotificationRepository } from '../../infrastructure/repositories/notification.repository';
import { NotificationStreamService } from '../../infrastructure/services/notification-stream.service';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationType } from '../../domain/entities/notification.entity';
import { logger } from '@shared/logger/logger';

export class NotificationService {
  private static instance: NotificationService | null = null;
  private readonly repo: NotificationRepository;
  private readonly stream: NotificationStreamService;

  private constructor() {
    this.repo = new NotificationRepository();
    this.stream = NotificationStreamService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Creates a notification in DB and immediately broadcasts it to all SSE clients.
   */
  public async notify(params: {
    userId: string | null;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      const notification = Notification.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? null,
      });

      const saved = await this.repo.save(notification);

      // Broadcast via SSE immediately
      this.stream.broadcastNotification({
        id: saved.id,
        type: saved.type,
        title: saved.title,
        message: saved.message,
        metadata: saved.metadata,
        createdAt: saved.createdAt,
        isRead: false,
      });
    } catch (err) {
      logger.error({ err }, 'NotificationService.notify failed');
    }
  }
}

/**
 * @file notification.repository.interface.ts
 * @layer Domain
 */

import { Notification, NotificationType } from '../entities/notification.entity';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  /**
   * Returns notifications for a specific user, PLUS any broadcast notifications (userId = null).
   * Admins call this with userId = null to get only broadcast notifications.
   * allowedTypes restricts broadcast notifications according to the caller's role/permissions.
   */
  findForUser(userId: string | null, query: any, allowedTypes?: NotificationType[]): Promise<{ data: Notification[]; total: number }>;
  /** Count unread notifications for a user (includes permitted broadcasts) */
  countUnread(userId: string | null, allowedTypes?: NotificationType[]): Promise<number>;
  markAllRead(userId: string | null, allowedTypes?: NotificationType[]): Promise<void>;
  markManyRead(ids: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  deleteAll(userId: string | null, allowedTypes?: NotificationType[]): Promise<void>;
}

/**
 * @file notification.repository.interface.ts
 * @layer Domain
 */

import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  /**
   * Returns notifications for a specific user, PLUS any broadcast notifications (userId = null).
   * Admins call this with userId = null to get only broadcast notifications.
   */
  findForUser(userId: string | null, query: any): Promise<{ data: Notification[]; total: number }>;
  /** Count unread notifications for a user (includes broadcasts) */
  countUnread(userId: string | null): Promise<number>;
  markAllRead(userId: string | null): Promise<void>;
  delete(id: string): Promise<void>;
}

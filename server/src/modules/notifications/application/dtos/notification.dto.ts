/**
 * @file notification.dto.ts
 * @layer Application › DTOs
 */

import { NotificationType } from '../../domain/entities/notification.entity';

// Re-export for convenience
export type { NotificationType };

export interface CreateNotificationRequestDTO {
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationResponseDTO {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

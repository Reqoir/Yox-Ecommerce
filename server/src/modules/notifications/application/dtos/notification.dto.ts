/**
 * @file notification.dto.ts
 * @layer Application › DTOs
 */

export interface CreateNotificationRequestDTO {
  userId: string | null;
  type: 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationResponseDTO {
  id: string;
  userId: string | null;
  type: 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

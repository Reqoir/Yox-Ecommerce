/**
 * @file notification.entity.ts
 * @layer Domain
 *
 * Represents a system notification.
 * - userId = null  → admin-wide broadcast (e.g. LOW_STOCK alert for all admins)
 * - userId = string → targeted to a specific user (e.g. order update)
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export type NotificationType = 'LOW_STOCK' | 'ORDER_STATUS' | 'SYSTEM';

export interface NotificationProps extends EntityProps {
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  /** Arbitrary JSON payload — e.g. { inventoryId, variantId, currentStock, threshold } */
  metadata?: Record<string, unknown> | null;
}

export class Notification extends BaseEntity<NotificationProps> {
  private constructor(props: NotificationProps) {
    super(props);
  }

  get userId(): string | null { return this._props.userId; }
  get type(): NotificationType { return this._props.type; }
  get title(): string { return this._props.title; }
  get message(): string { return this._props.message; }
  get isRead(): boolean { return this._props.isRead; }
  get metadata(): Record<string, unknown> | null | undefined { return this._props.metadata; }

  public markAsRead(): void {
    this._props.isRead = true;
    this._props.updatedAt = new Date();
  }

  public static create(
    props: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>
  ): Notification {
    return new Notification({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isRead: false,
      ...props,
    });
  }

  public static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }
}

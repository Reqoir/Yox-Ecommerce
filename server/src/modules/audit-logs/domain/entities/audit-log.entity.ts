/**
 * @file audit-log.entity.ts
 * @layer Domain › Entities
 * @description Domain entity representing an immutable system or business audit log record.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export enum AuditAction {
  // Auth
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_FAILED_LOGIN = 'AUTH_FAILED_LOGIN',

  // Users & RBAC
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Products
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',

  // Inventory
  INVENTORY_ADJUSTED = 'INVENTORY_ADJUSTED',

  // Orders
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',

  // Payments
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Refunds
  REFUND_CREATED = 'REFUND_CREATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  REFUND_FAILED = 'REFUND_FAILED',

  // Shipments
  SHIPMENT_CREATED = 'SHIPMENT_CREATED',
  SHIPMENT_STATUS_CHANGED = 'SHIPMENT_STATUS_CHANGED',

  // Returns
  RETURN_CREATED = 'RETURN_CREATED',
  RETURN_APPROVED = 'RETURN_APPROVED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  RETURN_RECEIVED = 'RETURN_RECEIVED',
  RETURN_INSPECTED = 'RETURN_INSPECTED',
}

export type ActorRole = 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SYSTEM';

export interface AuditLogProps extends EntityProps {
  actorId: string;
  actorRole: ActorRole | string;
  action: AuditAction | string;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, any> | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLog extends BaseEntity<AuditLogProps> {
  private constructor(props: AuditLogProps) {
    super(props);
  }

  get actorId(): string { return this._props.actorId; }
  get actorRole(): string { return this._props.actorRole; }
  get action(): string { return this._props.action; }
  get resourceType(): string { return this._props.resourceType; }
  get resourceId(): string { return this._props.resourceId; }
  get description(): string { return this._props.description; }
  get metadata(): Record<string, any> | null | undefined { return this._props.metadata; }
  get before(): Record<string, any> | null | undefined { return this._props.before; }
  get after(): Record<string, any> | null | undefined { return this._props.after; }
  get ipAddress(): string | null | undefined { return this._props.ipAddress; }
  get userAgent(): string | null | undefined { return this._props.userAgent; }

  public static create(props: Omit<AuditLogProps, 'id' | 'createdAt' | 'updatedAt'>): AuditLog {
    const now = new Date();
    return new AuditLog({
      id: '',
      createdAt: now,
      updatedAt: now,
      ...props,
    });
  }

  public static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }
}

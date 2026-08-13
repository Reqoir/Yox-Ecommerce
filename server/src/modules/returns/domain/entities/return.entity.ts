/**
 * @file return.entity.ts
 * @layer Domain › Entities
 * @description Core Return aggregate root managing return request lifecycle and inspection states.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type ReturnReason =
  | 'WRONG_SIZE'
  | 'WRONG_PRODUCT'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'NOT_AS_EXPECTED'
  | 'CHANGED_MIND'
  | 'OTHER';

export type InspectionResult = 'RESELLABLE' | 'DAMAGED';

export interface ReturnProps extends EntityProps {
  orderId: string;
  orderItemId: string; // ProductVariant ID or Snapshot item ID
  userId: string;
  quantity: number;
  reason: ReturnReason | string;
  customerNote?: string | null;
  images?: string[];
  status: ReturnStatus | string;
  inspectionResult?: InspectionResult | string | null;
  rejectionReason?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  refundMethod?: string | null;
  refundTransactionId?: string | null;
  approvedAt?: Date | null;
  receivedAt?: Date | null;
  inspectedAt?: Date | null;
  refundedAt?: Date | null;
  pickupDate?: Date | null;
  pickupTimeSlot?: string | null;
  pickupAgentName?: string | null;
  pickupAgentPhone?: string | null;
}

export class Return extends BaseEntity<ReturnProps> {
  private constructor(props: ReturnProps) {
    super(props);
  }

  get orderId(): string { return this._props.orderId; }
  get orderItemId(): string { return this._props.orderItemId; }
  get userId(): string { return this._props.userId; }
  get quantity(): number { return this._props.quantity; }
  get reason(): string { return this._props.reason; }
  get customerNote(): string | null | undefined { return this._props.customerNote; }
  get images(): string[] { return this._props.images || []; }
  get status(): string { return this._props.status; }
  get inspectionResult(): string | null | undefined { return this._props.inspectionResult; }
  get rejectionReason(): string | null | undefined { return this._props.rejectionReason; }
  get refundId(): string | null | undefined { return this._props.refundId; }
  get refundAmount(): number | null | undefined { return this._props.refundAmount; }
  get refundMethod(): string | null | undefined { return this._props.refundMethod; }
  get refundTransactionId(): string | null | undefined { return this._props.refundTransactionId; }
  get approvedAt(): Date | null | undefined { return this._props.approvedAt; }
  get receivedAt(): Date | null | undefined { return this._props.receivedAt; }
  get inspectedAt(): Date | null | undefined { return this._props.inspectedAt; }
  get refundedAt(): Date | null | undefined { return this._props.refundedAt; }
  get pickupDate(): Date | null | undefined { return this._props.pickupDate; }
  get pickupTimeSlot(): string | null | undefined { return this._props.pickupTimeSlot; }
  get pickupAgentName(): string | null | undefined { return this._props.pickupAgentName; }
  get pickupAgentPhone(): string | null | undefined { return this._props.pickupAgentPhone; }

  public static create(props: Omit<ReturnProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Return {
    if (props.quantity <= 0) {
      throw new Error('Return quantity must be greater than zero');
    }
    const now = new Date();
    return new Return({
      id: '',
      createdAt: now,
      updatedAt: now,
      status: props.status || 'REQUESTED',
      ...props,
    });
  }

  public static reconstitute(props: ReturnProps): Return {
    return new Return(props);
  }

  public approve(): void {
    if (this._props.status !== 'REQUESTED') {
      throw new Error(`Cannot approve return from status: ${this._props.status}`);
    }
    this._props.status = 'APPROVED';
    this._props.approvedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public reject(reason: string): void {
    if (this._props.status !== 'REQUESTED') {
      throw new Error(`Cannot reject return from status: ${this._props.status}`);
    }
    this._props.status = 'REJECTED';
    this._props.rejectionReason = reason || 'Return request rejected by staff';
    this._props.updatedAt = new Date();
  }

  public schedulePickup(params: {
    pickupDate: Date;
    pickupTimeSlot?: string;
    pickupAgentName?: string;
    pickupAgentPhone?: string;
  }): void {
    if (this._props.status !== 'APPROVED' && this._props.status !== 'REQUESTED') {
      throw new Error(`Cannot schedule pickup from status: ${this._props.status}`);
    }
    this._props.status = 'PICKUP_SCHEDULED';
    this._props.pickupDate = params.pickupDate;
    if (params.pickupTimeSlot) this._props.pickupTimeSlot = params.pickupTimeSlot;
    if (params.pickupAgentName) this._props.pickupAgentName = params.pickupAgentName;
    if (params.pickupAgentPhone) this._props.pickupAgentPhone = params.pickupAgentPhone;
    this._props.updatedAt = new Date();
  }

  public markPickedUp(): void {
    if (this._props.status !== 'PICKUP_SCHEDULED' && this._props.status !== 'APPROVED') {
      throw new Error(`Cannot mark picked up from status: ${this._props.status}`);
    }
    this._props.status = 'PICKED_UP';
    this._props.updatedAt = new Date();
  }

  public markReceived(): void {
    if (this._props.status !== 'PICKED_UP' && this._props.status !== 'APPROVED' && this._props.status !== 'PICKUP_SCHEDULED') {
      throw new Error(`Cannot mark received from status: ${this._props.status}`);
    }
    this._props.status = 'RECEIVED';
    this._props.receivedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public inspect(result: InspectionResult): void {
    if (this._props.status !== 'RECEIVED') {
      throw new Error(`Cannot inspect return from status: ${this._props.status}`);
    }
    this._props.inspectionResult = result;
    this._props.inspectedAt = new Date();
    this._props.status = 'REFUND_PENDING';
    this._props.updatedAt = new Date();
  }

  public markRefunded(params: {
    refundId?: string;
    refundAmount?: number;
    refundMethod?: string;
    refundTransactionId?: string;
  }): void {
    if (this._props.status !== 'REFUND_PENDING' && this._props.status !== 'INSPECTED' && this._props.status !== 'RECEIVED' && this._props.status !== 'APPROVED') {
      throw new Error(`Cannot mark refunded from status: ${this._props.status}`);
    }
    this._props.status = 'REFUNDED';
    if (params.refundId) this._props.refundId = params.refundId;
    if (params.refundAmount !== undefined) this._props.refundAmount = params.refundAmount;
    if (params.refundMethod) this._props.refundMethod = params.refundMethod;
    if (params.refundTransactionId) this._props.refundTransactionId = params.refundTransactionId;
    this._props.refundedAt = new Date();
    this._props.updatedAt = new Date();
  }
}

/**
 * @file payment.entity.ts
 * @layer Domain › Entities
 * @description Payment and Refund domain entities.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export type PaymentMethod = 'COD' | 'RAZORPAY' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface RefundProps extends EntityProps {
  paymentId?: string | null;
  orderId: string;
  returnId: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  gatewayRefundId?: string | null;
  status: RefundStatus | string;
  failureReason?: string | null;
  processedAt?: Date | null;
}

export class Refund extends BaseEntity<RefundProps> {
  private constructor(props: RefundProps) {
    super(props);
  }

  get paymentId(): string | null | undefined { return this._props.paymentId; }
  get orderId(): string { return this._props.orderId; }
  get returnId(): string { return this._props.returnId; }
  get amount(): number { return this._props.amount; }
  get paymentMethod(): string { return this._props.paymentMethod; }
  get gatewayRefundId(): string | null | undefined { return this._props.gatewayRefundId; }
  get status(): string { return this._props.status; }
  get failureReason(): string | null | undefined { return this._props.failureReason; }
  get processedAt(): Date | null | undefined { return this._props.processedAt; }

  public static create(props: Omit<RefundProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Refund {
    if (props.amount <= 0) {
      throw new Error('Refund amount must be greater than zero');
    }
    const now = new Date();
    return new Refund({
      id: '',
      createdAt: now,
      updatedAt: now,
      status: props.status || 'PENDING',
      ...props,
    });
  }

  public static reconstitute(props: RefundProps): Refund {
    return new Refund(props);
  }

  public markProcessing(): void {
    if (this._props.status === 'COMPLETED') {
      throw new Error('Cannot transition a COMPLETED refund back to PROCESSING');
    }
    this._props.status = 'PROCESSING';
    this._props.updatedAt = new Date();
  }

  public markCompleted(gatewayRefundId?: string): void {
    if (this._props.status === 'COMPLETED') {
      throw new Error('Refund is already COMPLETED');
    }
    this._props.status = 'COMPLETED';
    if (gatewayRefundId) this._props.gatewayRefundId = gatewayRefundId;
    this._props.processedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public markFailed(reason: string): void {
    if (this._props.status === 'COMPLETED') {
      throw new Error('Cannot mark a COMPLETED refund as FAILED');
    }
    this._props.status = 'FAILED';
    this._props.failureReason = reason || 'Refund processing failed';
    this._props.updatedAt = new Date();
  }
}

export interface PaymentProps extends EntityProps {
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  transactionId?: string | null;
  gatewayOrderId?: string | null;
  refundedAmount?: number;
}

export class Payment extends BaseEntity<PaymentProps> {
  private constructor(props: PaymentProps) {
    super(props);
  }

  get orderId(): string { return this._props.orderId; }
  get userId(): string { return this._props.userId; }
  get amount(): number { return this._props.amount; }
  get paymentMethod(): string { return this._props.paymentMethod; }
  get paymentStatus(): string { return this._props.paymentStatus; }
  get transactionId(): string | null | undefined { return this._props.transactionId; }
  get gatewayOrderId(): string | null | undefined { return this._props.gatewayOrderId; }
  get refundedAmount(): number { return this._props.refundedAmount || 0; }

  public static create(props: Omit<PaymentProps, 'id' | 'createdAt' | 'updatedAt' | 'refundedAmount'> & { refundedAmount?: number }): Payment {
    const now = new Date();
    return new Payment({
      id: '',
      createdAt: now,
      updatedAt: now,
      refundedAmount: props.refundedAmount || 0,
      ...props,
    });
  }

  public static reconstitute(props: PaymentProps): Payment {
    return new Payment(props);
  }

  public addRefund(refundAmount: number): void {
    const currentRefunded = this._props.refundedAmount || 0;
    if (currentRefunded + refundAmount > this._props.amount) {
      throw new Error(`Refund amount ₹${refundAmount} exceeds remaining refundable limit ₹${this._props.amount - currentRefunded}`);
    }
    this._props.refundedAmount = currentRefunded + refundAmount;
    if (this._props.refundedAmount >= this._props.amount) {
      this._props.paymentStatus = 'REFUNDED';
    }
    this._props.updatedAt = new Date();
  }
}

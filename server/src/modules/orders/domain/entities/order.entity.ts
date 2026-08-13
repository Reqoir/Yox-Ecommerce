/**
 * @file order.entity.ts
 * @layer Domain › Entities
 * @description Defines the core Order aggregate root, OrderItem value object, shipping address snapshot, and state machine transition rules.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'RAZORPAY' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';

export interface OrderItemSnapshot {
  id?: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  imageUrl?: string | null;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  streetAddress: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string | null;
  addressType?: string | null;
}

export interface OrderProps extends EntityProps {
  orderNumber: string;
  userId: string;
  couponId?: string | null;
  paymentId?: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus | string;
  orderStatus: OrderStatus | string;
  notes?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  items: OrderItemSnapshot[];
  placedAt: Date;
  confirmedAt?: Date | null;
  packedAt?: Date | null;
  shippedAt?: Date | null;
  outForDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledReason?: string | null;
  trackingNumber?: string | null;
  deliveryPartnerId?: string | null;
}

export class Order extends BaseEntity<OrderProps> {
  private constructor(props: OrderProps) {
    super({
      ...props,
      shippingAddress: { ...props.shippingAddress },
      items: props.items ? props.items.map(item => ({ ...item })) : [],
    });
  }

  get orderNumber(): string { return this._props.orderNumber; }
  get userId(): string { return this._props.userId; }
  get couponId(): string | null | undefined { return this._props.couponId; }
  get paymentId(): string | null | undefined { return this._props.paymentId; }
  get subtotal(): number { return this._props.subtotal; }
  get discount(): number { return this._props.discount; }
  get shippingCharge(): number { return this._props.shippingCharge; }
  get tax(): number { return this._props.tax; }
  get totalAmount(): number { return this._props.totalAmount; }
  get paymentMethod(): string { return this._props.paymentMethod; }
  get paymentStatus(): string { return this._props.paymentStatus; }
  get orderStatus(): string { return this._props.orderStatus; }
  get notes(): string | null | undefined { return this._props.notes; }
  get shippingAddress(): ShippingAddressSnapshot { return { ...this._props.shippingAddress }; }
  get items(): OrderItemSnapshot[] { return this._props.items ? this._props.items.map(item => ({ ...item })) : []; }
  get placedAt(): Date { return this._props.placedAt; }
  get confirmedAt(): Date | null | undefined { return this._props.confirmedAt; }
  get packedAt(): Date | null | undefined { return this._props.packedAt; }
  get shippedAt(): Date | null | undefined { return this._props.shippedAt; }
  get outForDeliveryAt(): Date | null | undefined { return this._props.outForDeliveryAt; }
  get deliveredAt(): Date | null | undefined { return this._props.deliveredAt; }
  get cancelledAt(): Date | null | undefined { return this._props.cancelledAt; }
  get cancelledReason(): string | null | undefined { return this._props.cancelledReason; }
  get trackingNumber(): string | null | undefined { return this._props.trackingNumber; }
  get deliveryPartnerId(): string | null | undefined { return this._props.deliveryPartnerId; }

  public static create(props: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt' | 'placedAt' | 'orderStatus' | 'paymentStatus'> & { orderStatus?: string; paymentStatus?: string; placedAt?: Date }): Order {
    if (!props.items || props.items.length === 0) {
      throw new Error('An order must contain at least one item');
    }
    if (props.totalAmount < 0) {
      throw new Error('Order total amount cannot be negative');
    }
    const now = new Date();
    return new Order({
      id: '',
      createdAt: now,
      updatedAt: now,
      placedAt: props.placedAt || now,
      orderStatus: props.orderStatus || 'PLACED',
      paymentStatus: props.paymentStatus || (props.paymentMethod === 'COD' ? 'PENDING' : 'PAID'),
      ...props
    });
  }

  public static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  // State machine validations and transitions
  public confirm(): void {
    if (this._props.orderStatus !== 'PLACED') {
      throw new Error(`Cannot confirm order from status: ${this._props.orderStatus}`);
    }
    this._props.orderStatus = 'CONFIRMED';
    this._props.confirmedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public pack(): void {
    if (this._props.orderStatus !== 'CONFIRMED' && this._props.orderStatus !== 'PLACED') {
      throw new Error(`Cannot pack order from status: ${this._props.orderStatus}`);
    }
    this._props.orderStatus = 'PACKED';
    this._props.packedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public ship(trackingNumber?: string, deliveryPartnerId?: string): void {
    if (this._props.orderStatus !== 'PACKED' && this._props.orderStatus !== 'CONFIRMED') {
      throw new Error(`Cannot ship order from status: ${this._props.orderStatus}`);
    }
    this._props.orderStatus = 'SHIPPED';
    if (trackingNumber) this._props.trackingNumber = trackingNumber;
    if (deliveryPartnerId) this._props.deliveryPartnerId = deliveryPartnerId;
    this._props.shippedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public outForDelivery(): void {
    if (this._props.orderStatus !== 'SHIPPED') {
      throw new Error(`Cannot mark order out for delivery from status: ${this._props.orderStatus}`);
    }
    this._props.orderStatus = 'OUT_FOR_DELIVERY';
    this._props.outForDeliveryAt = new Date();
    this._props.updatedAt = new Date();
  }

  public deliver(): void {
    if (this._props.orderStatus !== 'OUT_FOR_DELIVERY' && this._props.orderStatus !== 'SHIPPED') {
      throw new Error(`Cannot deliver order from status: ${this._props.orderStatus}`);
    }
    this._props.orderStatus = 'DELIVERED';
    this._props.deliveredAt = new Date();
    if (this._props.paymentMethod === 'COD' && this._props.paymentStatus === 'PENDING') {
      this._props.paymentStatus = 'PAID';
    }
    this._props.updatedAt = new Date();
  }

  public cancel(reason: string, isAdmin = false): void {
    const nonCancellableStatuses: string[] = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!isAdmin && nonCancellableStatuses.includes(this._props.orderStatus)) {
      throw new Error(`Cannot cancel order from current status: ${this._props.orderStatus}`);
    }
    if (this._props.orderStatus === 'CANCELLED') {
      throw new Error('Order is already cancelled');
    }
    this._props.orderStatus = 'CANCELLED';
    this._props.cancelledReason = reason || 'No reason provided';
    this._props.cancelledAt = new Date();
    if (this._props.paymentStatus === 'PAID') {
      this._props.paymentStatus = 'REFUNDED';
    }
    this._props.updatedAt = new Date();
  }

  public updateStatus(newStatus: OrderStatus | string, notes?: string): void {
    const validStatuses: string[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }
    this._props.orderStatus = newStatus;
    if (notes) {
      this._props.notes = this._props.notes ? `${this._props.notes} | ${notes}` : notes;
    }
    this._props.updatedAt = new Date();
  }

  public updatePaymentStatus(newStatus: PaymentStatus | string, paymentId?: string): void {
    this._props.paymentStatus = newStatus;
    if (paymentId) this._props.paymentId = paymentId;
    this._props.updatedAt = new Date();
  }
}

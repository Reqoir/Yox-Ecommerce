/**
 * @file shipment.entity.ts
 * @layer Domain › Entities
 * @description Defines the Shipment domain entity and status transitions.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export type ShipmentStatus =
  | 'PENDING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNED_TO_SELLER';

export interface ShipmentProps extends EntityProps {
  orderId: string;
  deliveryPartnerId?: string | null;
  trackingNumber?: string | null;
  status: ShipmentStatus | string;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  notes?: string | null;
}

export class Shipment extends BaseEntity<ShipmentProps> {
  private constructor(props: ShipmentProps) {
    super(props);
  }

  get orderId(): string { return this._props.orderId; }
  get deliveryPartnerId(): string | null | undefined { return this._props.deliveryPartnerId; }
  get trackingNumber(): string | null | undefined { return this._props.trackingNumber; }
  get status(): string { return this._props.status; }
  get estimatedDeliveryDate(): Date | null | undefined { return this._props.estimatedDeliveryDate; }
  get shippedAt(): Date | null | undefined { return this._props.shippedAt; }
  get deliveredAt(): Date | null | undefined { return this._props.deliveredAt; }
  get failedAt(): Date | null | undefined { return this._props.failedAt; }
  get notes(): string | null | undefined { return this._props.notes; }

  public static create(props: Omit<ShipmentProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Shipment {
    const now = new Date();
    return new Shipment({
      id: '',
      createdAt: now,
      updatedAt: now,
      status: props.status || 'PENDING',
      ...props,
    });
  }

  public static reconstitute(props: ShipmentProps): Shipment {
    return new Shipment(props);
  }

  public updateStatus(newStatus: ShipmentStatus | string, notes?: string): void {
    const validStatuses = [
      'PENDING',
      'READY_TO_SHIP',
      'SHIPPED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELIVERY_FAILED',
      'RETURNED_TO_SELLER',
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid shipment status: ${newStatus}`);
    }

    this._props.status = newStatus;
    if (newStatus === 'SHIPPED' && !this._props.shippedAt) {
      this._props.shippedAt = new Date();
    }
    if (newStatus === 'DELIVERED') {
      this._props.deliveredAt = new Date();
    }
    if (newStatus === 'DELIVERY_FAILED') {
      this._props.failedAt = new Date();
    }
    if (notes) {
      this._props.notes = this._props.notes ? `${this._props.notes} | ${notes}` : notes;
    }
    this._props.updatedAt = new Date();
  }

  public setTracking(trackingNumber: string, deliveryPartnerId?: string): void {
    this._props.trackingNumber = trackingNumber;
    if (deliveryPartnerId) {
      this._props.deliveryPartnerId = deliveryPartnerId;
    }
    this._props.updatedAt = new Date();
  }
}

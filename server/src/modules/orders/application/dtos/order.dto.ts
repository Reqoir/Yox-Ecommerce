/**
 * @file order.dto.ts
 * @layer Application › DTOs
 */

import { OrderItemSnapshot, ShippingAddressSnapshot } from '../../domain/entities/order.entity';

export interface PlaceOrderRequestDTO {
  addressId?: string;
  shippingAddress?: ShippingAddressSnapshot;
  paymentMethod: string;
  paymentId?: string;
  couponId?: string;
  notes?: string;
}

export interface CancelOrderRequestDTO {
  reason?: string;
}

export interface ShipOrderRequestDTO {
  trackingNumber?: string;
  deliveryPartnerId?: string;
}

export interface UpdateOrderStatusRequestDTO {
  status: string;
  notes?: string;
}

export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  userId: string;
  couponId?: string | null;
  paymentId?: string | null;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @file shipment.dto.ts
 * @layer Application › DTOs
 */

export interface CreateShipmentRequestDTO {
  orderId: string;
  deliveryPartnerId?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date | string;
  notes?: string;
}

export interface UpdateShipmentStatusRequestDTO {
  status: string;
  notes?: string;
  trackingNumber?: string;
  deliveryPartnerId?: string;
}

export interface ShipmentResponseDTO {
  id: string;
  orderId: string;
  deliveryPartnerId?: string | null;
  trackingNumber?: string | null;
  status: string;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

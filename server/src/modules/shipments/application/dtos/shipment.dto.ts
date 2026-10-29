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
  shiprocketOrderId?: number | string | null;
  shiprocketShipmentId?: number | string | null;
  awbCode?: string | null;
  courierName?: string | null;
  pickupTokenNumber?: string | null;
  pickupScheduledDate?: Date | null;
  labelUrl?: string | null;
  invoiceUrl?: string | null;
  trackingActivities?: Array<{
    date: string;
    status: string;
    activity: string;
    location: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

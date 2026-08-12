/**
 * @file return.dto.ts
 * @layer Application › DTOs
 */

import { ReturnReason, ReturnStatus, InspectionResult } from '../../domain/entities/return.entity';

export interface CreateReturnRequestDTO {
  orderId: string;
  orderItemId: string; // ProductVariant ID or Snapshot Item ID
  quantity: number;
  reason: ReturnReason | string;
  customerNote?: string;
}

export interface RejectReturnRequestDTO {
  reason: string;
}

export interface SchedulePickupRequestDTO {
  pickupDate: Date | string;
}

export interface InspectReturnRequestDTO {
  inspectionResult: InspectionResult; // 'RESELLABLE' | 'DAMAGED'
  notes?: string;
}

export interface ReturnResponseDTO {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  quantity: number;
  reason: string;
  customerNote?: string | null;
  status: string;
  inspectionResult?: string | null;
  rejectionReason?: string | null;
  refundId?: string | null;
  refundAmount?: number | null;
  approvedAt?: Date | null;
  receivedAt?: Date | null;
  inspectedAt?: Date | null;
  refundedAt?: Date | null;
  pickupDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

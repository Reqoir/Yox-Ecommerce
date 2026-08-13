/**
 * @file return.dto.ts
 * @layer Application › DTOs
 */

import { ReturnReason, InspectionResult } from '../../domain/entities/return.entity';

export interface CreateReturnRequestDTO {
  orderId: string;
  orderItemId: string; // ProductVariant ID or Snapshot Item ID
  quantity: number;
  reason: ReturnReason | string;
  customerNote?: string;
  images?: string[];
}

export interface RejectReturnRequestDTO {
  reason: string;
}

export interface SchedulePickupRequestDTO {
  pickupDate?: Date | string;
  pickupTimeSlot?: string;
  pickupAgentName?: string;
  pickupAgentPhone?: string;
}

export interface InspectReturnRequestDTO {
  inspectionResult: InspectionResult; // 'RESELLABLE' | 'DAMAGED'
  notes?: string;
}

export interface ProcessRefundRequestDTO {
  refundAmount?: number;
  refundMethod?: string;
  refundTransactionId?: string;
}

export interface ReturnResponseDTO {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  quantity: number;
  reason: string;
  customerNote?: string | null;
  images?: string[];
  status: string;
  inspectionResult?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

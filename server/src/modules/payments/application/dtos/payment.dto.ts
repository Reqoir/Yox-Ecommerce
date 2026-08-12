/**
 * @file payment.dto.ts
 * @layer Application › DTOs
 */

export interface ProcessRefundRequestDTO {
  returnId: string;
  notes?: string;
}

export interface RefundResponseDTO {
  id: string;
  paymentId?: string | null;
  orderId: string;
  returnId: string;
  amount: number;
  paymentMethod: string;
  gatewayRefundId?: string | null;
  status: string;
  failureReason?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @file payment-report.dto.ts
 * @layer Application › DTOs
 */

export interface PaymentReportFilterDTO {
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'currentMonth' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  method?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaymentReportSummaryDTO {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  grossCollected: number;
  totalRefunded: number;
  netCollected: number;
}

export interface MethodBreakdownItemDTO {
  transactionCount: number;
  amount: number;
}

export interface StatusBreakdownItemDTO {
  count: number;
  amount: number;
}

export interface PaymentReportBreakdownDTO {
  byMethod: Record<string, MethodBreakdownItemDTO>;
  byStatus: Record<string, StatusBreakdownItemDTO>;
}

export interface TransactionReportRecordDTO {
  id: string;
  paymentId?: string | null;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  method: string;
  amount: number;
  status: string;
  transactionId?: string | null;
  createdAt: string;
}

export interface PaginatedTransactionsResponseDTO {
  data: TransactionReportRecordDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

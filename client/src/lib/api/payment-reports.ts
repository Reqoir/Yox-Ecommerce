import apiClient from '../axios';

export interface PaymentReportFilter {
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'currentMonth' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  method?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaymentReportSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  grossCollected: number;
  totalRefunded: number;
  netCollected: number;
}

export interface MethodBreakdownItem {
  transactionCount: number;
  amount: number;
}

export interface StatusBreakdownItem {
  count: number;
  amount: number;
}

export interface PaymentReportBreakdown {
  byMethod: Record<string, MethodBreakdownItem>;
  byStatus: Record<string, StatusBreakdownItem>;
}

export interface TransactionReportRecord {
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

export interface PaginatedTransactionsResponse {
  data: TransactionReportRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FullPaymentReportResponse {
  summary: PaymentReportSummary;
  breakdown: PaymentReportBreakdown;
  transactions: PaginatedTransactionsResponse;
}

export const paymentReportsApi = {
  getFullReport: async (params?: PaymentReportFilter): Promise<FullPaymentReportResponse> => {
    const response = await apiClient.get<any>('/payment-reports', { params });
    return response.data?.data || response.data;
  },

  getSummary: async (params?: PaymentReportFilter): Promise<PaymentReportSummary> => {
    const response = await apiClient.get<any>('/payment-reports/summary', { params });
    return response.data?.data || response.data;
  },

  getBreakdown: async (params?: PaymentReportFilter): Promise<PaymentReportBreakdown> => {
    const response = await apiClient.get<any>('/payment-reports/breakdown', { params });
    return response.data?.data || response.data;
  },

  getTransactions: async (params?: PaymentReportFilter): Promise<PaginatedTransactionsResponse> => {
    const response = await apiClient.get<any>('/payment-reports/transactions', { params });
    const resData = response.data?.data || response.data;
    if (resData && Array.isArray(resData.data)) {
      return resData;
    }
    return {
      data: Array.isArray(resData) ? resData : [],
      total: resData?.total || 0,
      page: resData?.page || 1,
      limit: resData?.limit || 20,
      totalPages: resData?.totalPages || 1,
    };
  },
};

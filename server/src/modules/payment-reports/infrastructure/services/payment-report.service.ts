/**
 * @file payment-report.service.ts
 * @layer Infrastructure › Services
 * @description High-performance MongoDB aggregation engine for financial payment reporting over existing database collections.
 */

import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { ReturnModel } from '../../../returns/infrastructure/models/return.model';
import {
  PaymentReportFilterDTO,
  PaymentReportSummaryDTO,
  PaymentReportBreakdownDTO,
  PaginatedTransactionsResponseDTO,
  TransactionReportRecordDTO,
} from '../../application/dtos/payment-report.dto';

export class PaymentReportService {
  /**
   * Resolve date filter boundary from query presets or custom parameters.
   */
  public resolveDateRange(filter: PaymentReportFilterDTO): { dateFrom?: Date; dateTo?: Date } {
    const now = new Date();

    if (filter.preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { dateFrom: start, dateTo: now };
    }

    if (filter.preset === 'yesterday') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return { dateFrom: start, dateTo: end };
    }

    if (filter.preset === 'last7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { dateFrom: start, dateTo: now };
    }

    if (filter.preset === 'last30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { dateFrom: start, dateTo: now };
    }

    if (filter.preset === 'currentMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: start, dateTo: now };
    }

    return {
      dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
      dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
    };
  }

  /**
   * Get Aggregate Payment Report Summary using MongoDB Aggregations.
   */
  async getSummary(filter: PaymentReportFilterDTO): Promise<PaymentReportSummaryDTO> {
    const { dateFrom, dateTo } = this.resolveDateRange(filter);

    const matchQuery: any = {};
    if (dateFrom || dateTo) {
      matchQuery.placedAt = {};
      if (dateFrom) matchQuery.placedAt.$gte = dateFrom;
      if (dateTo) matchQuery.placedAt.$lte = dateTo;
    }

    if (filter.method) matchQuery.paymentMethod = filter.method.toUpperCase();
    if (filter.status) matchQuery.paymentStatus = filter.status.toUpperCase();

    // 1. Order Aggregations for Counts and Gross Collections
    const orderAgg = await OrderModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    let totalTransactions = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    let pendingTransactions = 0;
    let refundedTransactions = 0;
    let grossCollected = 0;

    orderAgg.forEach((item) => {
      totalTransactions += item.count;
      if (item._id === 'PAID') {
        successfulTransactions += item.count;
        grossCollected += item.totalAmount;
      } else if (item._id === 'FAILED') {
        failedTransactions += item.count;
      } else if (item._id === 'PENDING') {
        pendingTransactions += item.count;
      } else if (item._id === 'REFUNDED') {
        refundedTransactions += item.count;
      }
    });

    // 2. Refund Aggregations for Completed Refunds
    const returnMatchQuery: any = { status: 'REFUNDED' };
    if (dateFrom || dateTo) {
      returnMatchQuery.refundedAt = {};
      if (dateFrom) returnMatchQuery.refundedAt.$gte = dateFrom;
      if (dateTo) returnMatchQuery.refundedAt.$lte = dateTo;
    }

    const returnAgg = await ReturnModel.aggregate([
      { $match: returnMatchQuery },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundAmount' },
        },
      },
    ]);

    const totalRefunded = returnAgg.length > 0 ? (returnAgg[0].totalRefunded || 0) : 0;
    const netCollected = Math.max(0, grossCollected - totalRefunded);

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      refundedTransactions,
      grossCollected,
      totalRefunded,
      netCollected,
    };
  }

  /**
   * Get Method & Status Breakdowns using MongoDB Aggregation Pipelines.
   */
  async getBreakdown(filter: PaymentReportFilterDTO): Promise<PaymentReportBreakdownDTO> {
    const { dateFrom, dateTo } = this.resolveDateRange(filter);

    const matchQuery: any = {};
    if (dateFrom || dateTo) {
      matchQuery.placedAt = {};
      if (dateFrom) matchQuery.placedAt.$gte = dateFrom;
      if (dateTo) matchQuery.placedAt.$lte = dateTo;
    }

    // 1. Method Breakdown Pipeline
    const methodAgg = await OrderModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          transactionCount: { $sum: 1 },
          amount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    const byMethod: Record<string, { transactionCount: number; amount: number }> = {};
    methodAgg.forEach((m) => {
      if (m._id) {
        byMethod[m._id] = {
          transactionCount: m.transactionCount,
          amount: m.amount,
        };
      }
    });

    // 2. Status Breakdown Pipeline
    const statusAgg = await OrderModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const byStatus: Record<string, { count: number; amount: number }> = {};
    statusAgg.forEach((s) => {
      if (s._id) {
        byStatus[s._id] = {
          count: s.count,
          amount: s.amount,
        };
      }
    });

    return { byMethod, byStatus };
  }

  /**
   * Get Paginated Transaction List with date & parameter filtering.
   */
  async getTransactions(filter: PaymentReportFilterDTO): Promise<PaginatedTransactionsResponseDTO> {
    const { dateFrom, dateTo } = this.resolveDateRange(filter);
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const matchQuery: any = {};
    if (dateFrom || dateTo) {
      matchQuery.placedAt = {};
      if (dateFrom) matchQuery.placedAt.$gte = dateFrom;
      if (dateTo) matchQuery.placedAt.$lte = dateTo;
    }

    if (filter.method) matchQuery.paymentMethod = filter.method.toUpperCase();
    if (filter.status) matchQuery.paymentStatus = filter.status.toUpperCase();

    const [orders, total] = await Promise.all([
      OrderModel.find(matchQuery).sort({ placedAt: -1 }).skip(skip).limit(limit).exec(),
      OrderModel.countDocuments(matchQuery).exec(),
    ]);

    const data: TransactionReportRecordDTO[] = orders.map((o) => ({
      id: o._id.toString(),
      paymentId: o.paymentId || null,
      orderId: o._id.toString(),
      orderNumber: o.orderNumber,
      userId: o.userId,
      customerName: o.shippingAddress?.fullName || 'Customer',
      method: o.paymentMethod,
      amount: o.totalAmount,
      status: o.paymentStatus,
      transactionId: o.paymentId || o.trackingNumber || `TXN-${o.orderNumber}`,
      createdAt: (o.placedAt || o.createdAt).toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { ReportQueryParams, SalesReportDTO } from '../dtos/report-query.dto';

export class GetSalesReportUseCase {
  async execute(params: ReportQueryParams): Promise<SalesReportDTO> {
    const startDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const groupBy = params.groupBy || 'day';

    const dateMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // 1. Overall Summary Aggregation
    const summaryAgg = await OrderModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$totalAmount' },
          netRevenue: {
            $sum: {
              $cond: [{ $ne: ['$orderStatus', 'CANCELLED'] }, '$totalAmount', 0],
            },
          },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: '$tax' },
          totalShipping: { $sum: '$shippingCharge' },
          totalDiscounts: { $sum: '$discount' },
        },
      },
    ]);

    const summaryData = summaryAgg[0] || {
      grossRevenue: 0,
      netRevenue: 0,
      totalOrders: 0,
      totalTax: 0,
      totalShipping: 0,
      totalDiscounts: 0,
    };

    const averageOrderValue =
      summaryData.totalOrders > 0
        ? Number((summaryData.netRevenue / summaryData.totalOrders).toFixed(2))
        : 0;

    // 2. Order Status Breakdown
    const statusBreakdown = await OrderModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 3. Payment Method Breakdown
    const paymentMethodBreakdown = await OrderModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 4. Time Series Grouping
    let dateFormatStr = '%Y-%m-%d';
    if (groupBy === 'week') {
      dateFormatStr = '%Y-W%V';
    } else if (groupBy === 'month') {
      dateFormatStr = '%Y-%m';
    }

    const timeSeriesRaw = await OrderModel.aggregate([
      {
        $match: {
          ...dateMatch,
          orderStatus: { $ne: 'CANCELLED' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormatStr, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timeSeries = timeSeriesRaw.map((item) => ({
      period: item._id,
      revenue: item.revenue,
      ordersCount: item.ordersCount,
      averageOrderValue: item.ordersCount > 0 ? Number((item.revenue / item.ordersCount).toFixed(2)) : 0,
    }));

    return {
      summary: {
        grossRevenue: summaryData.grossRevenue,
        netRevenue: summaryData.netRevenue,
        totalOrders: summaryData.totalOrders,
        averageOrderValue,
        totalTax: summaryData.totalTax,
        totalShipping: summaryData.totalShipping,
        totalDiscounts: summaryData.totalDiscounts,
      },
      statusBreakdown: statusBreakdown.map((b) => ({
        orderStatus: b._id,
        count: b.count,
        totalRevenue: b.totalRevenue,
      })),
      paymentMethodBreakdown: paymentMethodBreakdown.map((p) => ({
        paymentMethod: p._id,
        count: p.count,
        totalRevenue: p.totalRevenue,
      })),
      timeSeries,
    };
  }
}

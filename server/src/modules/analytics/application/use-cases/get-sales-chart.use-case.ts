import { OrderModel } from '../../../orders/infrastructure/models/order.model';

export interface SalesChartData {
  date: string;
  revenue: number;
}

export class GetSalesChartUseCase {
  async execute(days: number = 30): Promise<SalesChartData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Group by date string (YYYY-MM-DD)
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'CANCELLED' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 as const }
      }
    ];

    const results = await OrderModel.aggregate(pipeline);

    // Fill in missing dates with zero revenue to ensure the chart looks continuous
    const chartData: SalesChartData[] = [];
    let currentDate = new Date(startDate);
    const endDate = new Date();

    const resultsMap = new Map<string, number>();
    results.forEach(r => resultsMap.set(r._id, r.revenue));

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        revenue: resultsMap.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  }
}

import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { ReportQueryParams, CustomerInsightsReportDTO } from '../dtos/report-query.dto';

export class GetCustomerInsightsReportUseCase {
  async execute(params: ReportQueryParams): Promise<CustomerInsightsReportDTO> {
    const startDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const limit = params.limit || 10;

    const dateMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // 1. Total & New Customers
    const totalCustomers = await UserModel.countDocuments({ role: 'CUSTOMER' });
    const newCustomersInPeriod = await UserModel.countDocuments({
      role: 'CUSTOMER',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Active customers (placed at least 1 non-cancelled order)
    const activeCustomerAgg = await OrderModel.aggregate([
      { $match: { ...dateMatch, orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$userId' } },
    ]);
    const activeCustomers = activeCustomerAgg.length;

    // 2. Repeat Customer Rate
    const customerOrderCounts = await OrderModel.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
    ]);
    const totalOrderPlacingCustomers = customerOrderCounts.length;
    const repeatCustomers = customerOrderCounts.filter((c) => c.orderCount > 1).length;
    const repeatCustomerRate =
      totalOrderPlacingCustomers > 0
        ? Number(((repeatCustomers / totalOrderPlacingCustomers) * 100).toFixed(1))
        : 0;

    // 3. Top Spending Customers in period
    const topCustomerAgg = await OrderModel.aggregate([
      { $match: { ...dateMatch, orderStatus: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
    ]);

    const userIds = topCustomerAgg.map((c) => c._id);
    const users = await UserModel.find({ _id: { $in: userIds } }).select('_id fullName email').lean();

    const userMap = new Map<string, { fullName: string; email: string }>();
    users.forEach((u: any) => {
      const uIdStr = u._id ? u._id.toString() : u.id;
      userMap.set(uIdStr, { fullName: u.fullName || 'Unknown Customer', email: u.email || '' });
    });

    const topCustomers = topCustomerAgg.map((item) => {
      const userInfo = userMap.get(item._id.toString()) || { fullName: 'Customer', email: '' };
      return {
        userId: item._id,
        fullName: userInfo.fullName,
        email: userInfo.email,
        totalOrders: item.totalOrders,
        totalSpent: item.totalSpent,
        averageOrderValue: item.totalOrders > 0 ? Number((item.totalSpent / item.totalOrders).toFixed(2)) : 0,
      };
    });

    return {
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomersInPeriod,
        repeatCustomerRate,
      },
      topCustomers,
    };
  }
}

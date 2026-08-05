import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

export class GetDashboardStatsUseCase {
  async execute(): Promise<DashboardStats> {
    const [revenueResult, totalOrders, totalCustomers, totalProducts] = await Promise.all([
      // Sum totalAmount of non-cancelled orders
      OrderModel.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      
      // Count non-cancelled orders
      OrderModel.countDocuments({ orderStatus: { $ne: 'CANCELLED' } }),

      // Count active customers
      UserModel.countDocuments({ role: 'CUSTOMER', status: 'ACTIVE' }),

      // Count active products
      ProductModel.countDocuments({ isActive: true })
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts
    };
  }
}

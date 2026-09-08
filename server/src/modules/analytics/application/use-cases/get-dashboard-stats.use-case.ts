import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { RoleModel } from '../../../roles/infrastructure/models/role.model';

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  email?: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  placedAt: Date;
  itemCount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  newCustomersThisMonth: number;
  orderStatusCounts: Record<string, number>;
  recentOrders: RecentOrderSummary[];
}

export class GetDashboardStatsUseCase {
  async execute(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Resolve roles to accurately identify customers vs staff
    const [customerRole, staffRoles] = await Promise.all([
      RoleModel.findOne({ name: 'CUSTOMER' }).lean(),
      RoleModel.find({ name: { $in: ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER'] } }).lean(),
    ]);

    const customerRoleIds = [customerRole?._id?.toString(), 'CUSTOMER_ROLE_ID', 'CUSTOMER', null, ''];
    const staffRoleIds = staffRoles.map((r) => r._id.toString());

    const customerFilter: any = {
      $or: [
        { roleId: { $in: customerRoleIds.filter(Boolean) } },
        { roleId: { $nin: staffRoleIds } },
      ],
      deletedAt: null,
    };

    const [
      revenueResult,
      totalOrders,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      statusAgg,
      recentOrderDocs,
    ] = await Promise.all([
      // Sum totalAmount of non-cancelled orders
      OrderModel.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),

      // Count non-cancelled orders
      OrderModel.countDocuments({ orderStatus: { $ne: 'CANCELLED' } }),

      // Accurate customer count
      UserModel.countDocuments(customerFilter),

      // New customers registered in the last 30 days
      UserModel.countDocuments({
        ...customerFilter,
        createdAt: { $gte: thirtyDaysAgo },
      }),

      // Count active products
      ProductModel.countDocuments({ isActive: true }),

      // Orders by status
      OrderModel.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      // 5 most recent orders
      OrderModel.find()
        .sort({ placedAt: -1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Build orderStatusCounts map
    const orderStatusCounts: Record<string, number> = {
      PLACED: 0,
      CONFIRMED: 0,
      PACKED: 0,
      SHIPPED: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      RETURNED: 0,
    };
    for (const item of statusAgg) {
      if (item._id) {
        orderStatusCounts[item._id] = item.count;
      }
    }

    // Resolve customer names for recent orders
    const userIds = Array.from(new Set(recentOrderDocs.map((o: any) => o.userId).filter(Boolean)));
    const users = await UserModel.find({ _id: { $in: userIds } }).select('_id fullName email').lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const recentOrders: RecentOrderSummary[] = recentOrderDocs.map((o: any) => {
      const u = userMap.get(o.userId?.toString());
      const customerName = u?.fullName || o.shippingAddress?.fullName || 'Verified Customer';
      const email = u?.email || '';
      const itemCount = (o.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);

      return {
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        customerName,
        email,
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        placedAt: o.placedAt || o.createdAt,
        itemCount,
      };
    });

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      orderStatusCounts,
      recentOrders,
    };
  }
}

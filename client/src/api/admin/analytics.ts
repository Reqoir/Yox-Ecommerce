import api from '../../lib/axios';

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  placedAt: string | Date;
  itemCount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomersThisMonth?: number;
  totalProducts: number;
  orderStatusCounts?: Record<string, number>;
  recentOrders?: RecentOrderSummary[];
}

export interface SalesChartData {
  date: string;
  revenue: number;
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/analytics/dashboard-stats');
    return response.data.data;
  },

  getSalesChart: async (days: number = 30): Promise<SalesChartData[]> => {
    const response = await api.get('/analytics/sales-chart', { params: { days } });
    return response.data.data;
  },
};

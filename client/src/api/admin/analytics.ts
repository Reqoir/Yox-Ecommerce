import api from '../../lib/axios';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
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

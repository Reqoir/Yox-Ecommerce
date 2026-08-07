import apiClient from '@/lib/axios';

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}

export interface SalesReport {
  summary: {
    grossRevenue: number;
    netRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalTax: number;
    totalShipping: number;
    totalDiscounts: number;
  };
  statusBreakdown: {
    orderStatus: string;
    count: number;
    totalRevenue: number;
  }[];
  paymentMethodBreakdown: {
    paymentMethod: string;
    count: number;
    totalRevenue: number;
  }[];
  timeSeries: {
    period: string;
    revenue: number;
    ordersCount: number;
    averageOrderValue: number;
  }[];
}

export interface ProductPerformanceReport {
  topProductsByRevenue: {
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    totalRevenue: number;
  }[];
  topProductsByQuantity: {
    productId: string;
    productName: string;
    sku: string;
    unitsSold: number;
    totalRevenue: number;
  }[];
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalProducts: number;
    totalUnitsSold: number;
    totalRevenue: number;
  }[];
  inventoryHealth: {
    totalVariants: number;
    lowStockVariants: number;
    outOfStockVariants: number;
  };
}

export interface CustomerInsightsReport {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomersInPeriod: number;
    repeatCustomerRate: number;
  };
  topCustomers: {
    userId: string;
    fullName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }[];
}

export interface InventoryReport {
  summary: {
    totalVariants: number;
    totalStockQuantity: number;
    totalInventoryValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStockItems: {
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    title: string;
    color?: string | null;
    size?: string | null;
    currentStock: number;
    lowStockThreshold: number;
    price: number;
  }[];
  outOfStockItems: {
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    title: string;
    price: number;
  }[];
}

export const reportsApi = {
  getSalesReport: async (params?: ReportQueryParams): Promise<SalesReport> => {
    const res = await apiClient.get('/reports/sales', { params });
    return res.data.data;
  },

  getProductPerformanceReport: async (params?: ReportQueryParams): Promise<ProductPerformanceReport> => {
    const res = await apiClient.get('/reports/products', { params });
    return res.data.data;
  },

  getCustomerInsightsReport: async (params?: ReportQueryParams): Promise<CustomerInsightsReport> => {
    const res = await apiClient.get('/reports/customers', { params });
    return res.data.data;
  },

  getInventoryReport: async (): Promise<InventoryReport> => {
    const res = await apiClient.get('/reports/inventory');
    return res.data.data;
  },

  exportReportCSV: async (type: 'sales' | 'products' | 'customers' | 'inventory', params?: ReportQueryParams): Promise<Blob> => {
    const res = await apiClient.get('/reports/export', {
      params: { ...params, type, format: 'csv' },
      responseType: 'blob',
    });
    return res.data;
  },
};

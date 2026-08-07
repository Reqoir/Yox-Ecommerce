export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
  format?: 'json' | 'csv';
}

export interface SalesReportDTO {
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

export interface ProductPerformanceReportDTO {
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

export interface CustomerInsightsReportDTO {
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

export interface InventoryReportDTO {
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

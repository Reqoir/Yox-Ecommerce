import { GetSalesReportUseCase } from './get-sales-report.use-case';
import { GetProductPerformanceReportUseCase } from './get-product-performance-report.use-case';
import { GetCustomerInsightsReportUseCase } from './get-customer-insights-report.use-case';
import { GetInventoryReportUseCase } from './get-inventory-report.use-case';
import { CsvExporterService } from '../../infrastructure/services/csv-exporter.service';
import { ReportQueryParams } from '../dtos/report-query.dto';

export class ExportReportUseCase {
  constructor(
    private salesReportUseCase: GetSalesReportUseCase,
    private productPerformanceReportUseCase: GetProductPerformanceReportUseCase,
    private customerInsightsReportUseCase: GetCustomerInsightsReportUseCase,
    private inventoryReportUseCase: GetInventoryReportUseCase
  ) {}

  async execute(type: string, params: ReportQueryParams): Promise<{ csvData: string; filename: string }> {
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'sales') {
      const report = await this.salesReportUseCase.execute(params);
      const rows = report.timeSeries.map((t) => ({
        Period: t.period,
        Revenue: t.revenue,
        'Total Orders': t.ordersCount,
        'Average Order Value': t.averageOrderValue,
      }));
      return {
        csvData: CsvExporterService.jsonToCsv(rows),
        filename: `sales_report_${timestamp}.csv`,
      };
    }

    if (type === 'products') {
      const report = await this.productPerformanceReportUseCase.execute(params);
      const rows = report.topProductsByRevenue.map((p, index) => ({
        Rank: index + 1,
        'Product Name': p.productName,
        SKU: p.sku,
        'Units Sold': p.unitsSold,
        'Total Revenue': p.totalRevenue,
      }));
      return {
        csvData: CsvExporterService.jsonToCsv(rows),
        filename: `product_performance_${timestamp}.csv`,
      };
    }

    if (type === 'customers') {
      const report = await this.customerInsightsReportUseCase.execute(params);
      const rows = report.topCustomers.map((c, index) => ({
        Rank: index + 1,
        Customer: c.fullName,
        Email: c.email,
        'Total Orders': c.totalOrders,
        'Total Spent': c.totalSpent,
        AOV: c.averageOrderValue,
      }));
      return {
        csvData: CsvExporterService.jsonToCsv(rows),
        filename: `customer_insights_${timestamp}.csv`,
      };
    }

    if (type === 'inventory') {
      const report = await this.inventoryReportUseCase.execute();
      const rows = [
        ...report.lowStockItems.map((item) => ({
          Status: 'LOW STOCK',
          Product: item.productName,
          Variant: item.title,
          SKU: item.sku,
          'Current Stock': item.currentStock,
          Threshold: item.lowStockThreshold,
          Price: item.price,
        })),
        ...report.outOfStockItems.map((item) => ({
          Status: 'OUT OF STOCK',
          Product: item.productName,
          Variant: item.title,
          SKU: item.sku,
          'Current Stock': 0,
          Threshold: '-',
          Price: item.price,
        })),
      ];
      return {
        csvData: CsvExporterService.jsonToCsv(rows),
        filename: `inventory_report_${timestamp}.csv`,
      };
    }

    throw new Error(`Unsupported report export type: ${type}`);
  }
}

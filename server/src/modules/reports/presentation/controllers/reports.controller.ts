import { Request, Response, NextFunction } from 'express';
import { GetSalesReportUseCase } from '../../application/use-cases/get-sales-report.use-case';
import { GetProductPerformanceReportUseCase } from '../../application/use-cases/get-product-performance-report.use-case';
import { GetCustomerInsightsReportUseCase } from '../../application/use-cases/get-customer-insights-report.use-case';
import { GetInventoryReportUseCase } from '../../application/use-cases/get-inventory-report.use-case';
import { ExportReportUseCase } from '../../application/use-cases/export-report.use-case';
import { ApiResponse } from '../../../../shared/utils/api-response.util';

export class ReportsController {
  constructor(
    private salesReportUseCase: GetSalesReportUseCase,
    private productPerformanceReportUseCase: GetProductPerformanceReportUseCase,
    private customerInsightsReportUseCase: GetCustomerInsightsReportUseCase,
    private inventoryReportUseCase: GetInventoryReportUseCase,
    private exportReportUseCase: ExportReportUseCase
  ) {}

  getSalesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.salesReportUseCase.execute(req.query as any);
      ApiResponse.success(res, data, 'Sales report fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getProductPerformanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.productPerformanceReportUseCase.execute(req.query as any);
      ApiResponse.success(res, data, 'Product performance report fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getCustomerInsightsReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.customerInsightsReportUseCase.execute(req.query as any);
      ApiResponse.success(res, data, 'Customer insights report fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getInventoryReport = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.inventoryReportUseCase.execute();
      ApiResponse.success(res, data, 'Inventory report fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = (req.query.type as string) || 'sales';
      const { csvData, filename } = await this.exportReportUseCase.execute(type, req.query as any);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  };
}

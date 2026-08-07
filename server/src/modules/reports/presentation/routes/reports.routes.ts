import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ReportsController } from '../controllers/reports.controller';
import { GetSalesReportUseCase } from '../../application/use-cases/get-sales-report.use-case';
import { GetProductPerformanceReportUseCase } from '../../application/use-cases/get-product-performance-report.use-case';
import { GetCustomerInsightsReportUseCase } from '../../application/use-cases/get-customer-insights-report.use-case';
import { GetInventoryReportUseCase } from '../../application/use-cases/get-inventory-report.use-case';
import { ExportReportUseCase } from '../../application/use-cases/export-report.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { reportQuerySchema } from '../validators/reports.validator';

const reportsRouter = Router();

// Rate limiter for report calculations (15 requests per 1 minute window)
const reportsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many report requests. Please wait a minute before trying again.',
});

// DI Setup
const salesReportUseCase = new GetSalesReportUseCase();
const productPerformanceReportUseCase = new GetProductPerformanceReportUseCase();
const customerInsightsReportUseCase = new GetCustomerInsightsReportUseCase();
const inventoryReportUseCase = new GetInventoryReportUseCase();
const exportReportUseCase = new ExportReportUseCase(
  salesReportUseCase,
  productPerformanceReportUseCase,
  customerInsightsReportUseCase,
  inventoryReportUseCase
);

const controller = new ReportsController(
  salesReportUseCase,
  productPerformanceReportUseCase,
  customerInsightsReportUseCase,
  inventoryReportUseCase,
  exportReportUseCase
);

// Validation middleware
const validateReportQuery = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    req.query = reportQuerySchema.parse(req.query) as any;
    next();
  } catch (err) {
    next(err);
  }
};

// All report routes require Auth + Permission
reportsRouter.use(requireAuth);
reportsRouter.use(requirePermission('view_reports'));
reportsRouter.use(reportsLimiter);

reportsRouter.get('/sales', validateReportQuery, controller.getSalesReport);
reportsRouter.get('/products', validateReportQuery, controller.getProductPerformanceReport);
reportsRouter.get('/customers', validateReportQuery, controller.getCustomerInsightsReport);
reportsRouter.get('/inventory', controller.getInventoryReport);
reportsRouter.get('/export', validateReportQuery, controller.exportReport);

export { reportsRouter };

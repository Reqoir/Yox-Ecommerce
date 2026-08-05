import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { GetDashboardStatsUseCase } from '../../application/use-cases/get-dashboard-stats.use-case';
import { GetSalesChartUseCase } from '../../application/use-cases/get-sales-chart.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const analyticsRouter = Router();

// DI Setup
const getDashboardStatsUseCase = new GetDashboardStatsUseCase();
const getSalesChartUseCase = new GetSalesChartUseCase();

const analyticsController = new AnalyticsController(
  getDashboardStatsUseCase,
  getSalesChartUseCase
);

// All routes require auth and specific dashboard read permissions
analyticsRouter.use(requireAuth);
// Assuming MANAGER or ADMIN roles would have wildcard or specific read permissions. We will just requireAuth + role check if needed, or permission check.
// If the permission system is complex, we can use a basic role check or permission check. Let's use permission check if they have one for dashboard.
analyticsRouter.use(requirePermission('dashboard:read'));

analyticsRouter.get('/dashboard-stats', analyticsController.getDashboardStats);
analyticsRouter.get('/sales-chart', analyticsController.getSalesChart);

export { analyticsRouter };

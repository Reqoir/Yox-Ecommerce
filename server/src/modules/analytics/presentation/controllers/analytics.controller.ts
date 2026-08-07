import { Request, Response, NextFunction } from 'express';
import { GetDashboardStatsUseCase } from '../../application/use-cases/get-dashboard-stats.use-case';
import { GetSalesChartUseCase } from '../../application/use-cases/get-sales-chart.use-case';

export class AnalyticsController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private readonly getSalesChartUseCase: GetSalesChartUseCase
  ) {}

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.getDashboardStatsUseCase.execute();
      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getSalesChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const chartData = await this.getSalesChartUseCase.execute(days);
      res.status(200).json({
        status: 'success',
        data: chartData
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * @file payment-report.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@shared/utils/api-response.util';
import {
  GetPaymentSummaryUseCase,
  GetPaymentBreakdownUseCase,
  GetPaymentTransactionsUseCase,
} from '../../application/use-cases/payment-report.use-cases';
import { PaymentReportFilterDTO } from '../../application/dtos/payment-report.dto';

export class PaymentReportController {
  constructor(
    private readonly getSummaryUseCase: GetPaymentSummaryUseCase,
    private readonly getBreakdownUseCase: GetPaymentBreakdownUseCase,
    private readonly getTransactionsUseCase: GetPaymentTransactionsUseCase
  ) {}

  private extractFilter(req: Request): PaymentReportFilterDTO {
    return {
      preset: req.query['preset'] as any,
      dateFrom: req.query['dateFrom'] as string,
      dateTo: req.query['dateTo'] as string,
      method: req.query['method'] as string,
      status: req.query['status'] as string,
      page: req.query['page'] ? Number(req.query['page']) : 1,
      limit: req.query['limit'] ? Number(req.query['limit']) : 20,
    };
  }

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = this.extractFilter(req);
      const result = await this.getSummaryUseCase.execute(filter);
      ApiResponse.success(res, result, 'Payment summary report calculated successfully');
    } catch (error) {
      next(error);
    }
  };

  getBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = this.extractFilter(req);
      const result = await this.getBreakdownUseCase.execute(filter);
      ApiResponse.success(res, result, 'Payment breakdown report calculated successfully');
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = this.extractFilter(req);
      const result = await this.getTransactionsUseCase.execute(filter);
      ApiResponse.success(res, result, 'Payment transactions report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getFullReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = this.extractFilter(req);
      const [summary, breakdown, transactions] = await Promise.all([
        this.getSummaryUseCase.execute(filter),
        this.getBreakdownUseCase.execute(filter),
        this.getTransactionsUseCase.execute(filter),
      ]);
      ApiResponse.success(
        res,
        { summary, breakdown, transactions },
        'Full payment report calculated successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}

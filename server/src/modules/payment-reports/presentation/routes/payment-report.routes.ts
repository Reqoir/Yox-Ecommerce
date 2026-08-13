/**
 * @file payment-report.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { PaymentReportService } from '../../infrastructure/services/payment-report.service';
import {
  GetPaymentSummaryUseCase,
  GetPaymentBreakdownUseCase,
  GetPaymentTransactionsUseCase,
} from '../../application/use-cases/payment-report.use-cases';
import { PaymentReportController } from '../controllers/payment-report.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// DI Setup
const service = new PaymentReportService();
const getSummaryUseCase = new GetPaymentSummaryUseCase(service);
const getBreakdownUseCase = new GetPaymentBreakdownUseCase(service);
const getTransactionsUseCase = new GetPaymentTransactionsUseCase(service);

const controller = new PaymentReportController(
  getSummaryUseCase,
  getBreakdownUseCase,
  getTransactionsUseCase
);

// Admin Financial Protection
router.use(requireAuth);
router.use(requirePermission('view_reports'));

router.get('/', controller.getFullReport);
router.get('/summary', controller.getSummary);
router.get('/breakdown', controller.getBreakdown);
router.get('/transactions', controller.getTransactions);

export { router as paymentReportRouter };

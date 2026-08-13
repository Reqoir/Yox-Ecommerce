/**
 * @file payment-report.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { PaymentReportService } from '../../infrastructure/services/payment-report.service';
import {
  PaymentReportFilterDTO,
  PaymentReportSummaryDTO,
  PaymentReportBreakdownDTO,
  PaginatedTransactionsResponseDTO,
} from '../dtos/payment-report.dto';

export class GetPaymentSummaryUseCase implements IUseCase<PaymentReportFilterDTO, PaymentReportSummaryDTO> {
  constructor(private readonly service: PaymentReportService) {}

  async execute(filter: PaymentReportFilterDTO): Promise<PaymentReportSummaryDTO> {
    return this.service.getSummary(filter);
  }
}

export class GetPaymentBreakdownUseCase implements IUseCase<PaymentReportFilterDTO, PaymentReportBreakdownDTO> {
  constructor(private readonly service: PaymentReportService) {}

  async execute(filter: PaymentReportFilterDTO): Promise<PaymentReportBreakdownDTO> {
    return this.service.getBreakdown(filter);
  }
}

export class GetPaymentTransactionsUseCase implements IUseCase<PaymentReportFilterDTO, PaginatedTransactionsResponseDTO> {
  constructor(private readonly service: PaymentReportService) {}

  async execute(filter: PaymentReportFilterDTO): Promise<PaginatedTransactionsResponseDTO> {
    return this.service.getTransactions(filter);
  }
}

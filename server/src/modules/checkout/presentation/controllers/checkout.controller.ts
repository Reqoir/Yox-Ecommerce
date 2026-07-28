/**
 * @file checkout.controller.ts
 * @layer Presentation
 * 
 * Express controller for Checkout endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { GetCheckoutSummaryUseCase } from '../../application/use-cases/get-checkout-summary.use-case';

export class CheckoutController {
  constructor(private readonly getCheckoutSummaryUseCase: GetCheckoutSummaryUseCase) {}

  /**
   * GET /api/v1/checkout/summary
   */
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const summary = await this.getCheckoutSummaryUseCase.execute(userId);
      ApiResponse.success(res, summary, 'Checkout summary retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

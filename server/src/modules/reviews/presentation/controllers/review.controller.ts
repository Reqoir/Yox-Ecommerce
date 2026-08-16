/**
 * @file review.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProductReviewsUseCase } from '../../application/use-cases/get-product-reviews.use-case';
import { ApiResponse } from '@shared/utils/api-response.util';

export class ReviewController {
  constructor(
    private createReviewUseCase: CreateReviewUseCase,
    private getProductReviewsUseCase: GetProductReviewsUseCase
  ) {}

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const data = {
        ...req.body,
        userId
      };

      const result = await this.createReviewUseCase.execute(data);
      ApiResponse.created(res, result, 'Review submitted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('FORBIDDEN')) {
        ApiResponse.error(res, error.message, 403);
      } else if (error instanceof Error && error.message.includes('already reviewed')) {
        ApiResponse.error(res, error.message, 400);
      } else {
        next(error);
      }
    }
  };

  getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getProductReviewsUseCase.execute({ productId, page, limit });
      ApiResponse.success(res, result, 'Product reviews fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}

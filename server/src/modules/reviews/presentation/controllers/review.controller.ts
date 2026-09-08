/**
 * @file review.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response } from 'express';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProductReviewsUseCase } from '../../application/use-cases/get-product-reviews.use-case';
import { GetAllReviewsUseCase } from '../../application/use-cases/get-all-reviews.use-case';
import { UpdateReviewStatusUseCase } from '../../application/use-cases/update-review-status.use-case';
import { GetUserReviewsUseCase } from '../../application/use-cases/get-user-reviews.use-case';
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case';
import { CheckReviewEligibilityUseCase } from '../../application/use-cases/check-review-eligibility.use-case';
import { ReviewStatus } from '../../domain/entities/review.entity';

export class ReviewController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly getProductReviewsUseCase: GetProductReviewsUseCase,
    private readonly getAllReviewsUseCase?: GetAllReviewsUseCase,
    private readonly updateReviewStatusUseCase?: UpdateReviewStatusUseCase,
    private readonly getUserReviewsUseCase?: GetUserReviewsUseCase,
    private readonly deleteReviewUseCase?: DeleteReviewUseCase,
    private readonly checkReviewEligibilityUseCase?: CheckReviewEligibilityUseCase
  ) {}

  createReview = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { productId, rating, title, comment } = req.body;
      const review = await this.createReviewUseCase.execute({
        productId,
        userId,
        rating,
        title,
        comment,
      });

      return res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getProductReviews = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getProductReviewsUseCase.execute({ productId, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  checkEligibility = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(200).json({
          success: true,
          data: {
            canReview: false,
            hasPurchased: false,
            isDelivered: false,
            alreadyReviewed: false,
            reason: 'LOGIN_REQUIRED',
          },
        });
      }

      if (!this.checkReviewEligibilityUseCase) {
        return res.status(501).json({ message: 'Not implemented' });
      }

      const result = await this.checkReviewEligibilityUseCase.execute({
        userId,
        productId,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllReviews = async (req: Request, res: Response) => {
    try {
      if (!this.getAllReviewsUseCase) return res.status(501).json({ message: 'Not implemented' });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await this.getAllReviewsUseCase.execute(page, limit, status, search);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateReviewStatus = async (req: Request, res: Response) => {
    try {
      if (!this.updateReviewStatusUseCase) return res.status(501).json({ message: 'Not implemented' });
      const { id } = req.params;
      const { status } = req.body;
      
      const result = await this.updateReviewStatusUseCase.execute(id, status as ReviewStatus);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteReview = async (req: Request, res: Response) => {
    try {
      if (!this.deleteReviewUseCase) return res.status(501).json({ message: 'Not implemented' });
      const { id } = req.params;
      await this.deleteReviewUseCase.execute(id);
      return res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserReviews = async (req: Request, res: Response) => {
    try {
      if (!this.getUserReviewsUseCase) return res.status(501).json({ message: 'Not implemented' });
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getUserReviewsUseCase.execute(userId, page, limit);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

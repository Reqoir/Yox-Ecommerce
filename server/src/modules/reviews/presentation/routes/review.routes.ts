/**
 * @file review.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { ReviewRepository } from '../../infrastructure/repositories/review.repository';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProductReviewsUseCase } from '../../application/use-cases/get-product-reviews.use-case';
import { GetAllReviewsUseCase } from '../../application/use-cases/get-all-reviews.use-case';
import { UpdateReviewStatusUseCase } from '../../application/use-cases/update-review-status.use-case';
import { GetUserReviewsUseCase } from '../../application/use-cases/get-user-reviews.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const reviewRepo = new ReviewRepository();
const createReviewUseCase = new CreateReviewUseCase(reviewRepo);
const getProductReviewsUseCase = new GetProductReviewsUseCase(reviewRepo);
const getAllReviewsUseCase = new GetAllReviewsUseCase(reviewRepo);
const updateReviewStatusUseCase = new UpdateReviewStatusUseCase(reviewRepo);
const getUserReviewsUseCase = new GetUserReviewsUseCase(reviewRepo);

const reviewController = new ReviewController(
  createReviewUseCase, 
  getProductReviewsUseCase,
  getAllReviewsUseCase,
  updateReviewStatusUseCase,
  getUserReviewsUseCase
);

export const reviewRoutes = Router();

// Public routes
reviewRoutes.get('/product/:productId', reviewController.getProductReviews);

// Protected routes (User)
reviewRoutes.use(requireAuth);
reviewRoutes.post('/', reviewController.createReview);
reviewRoutes.get('/mine', reviewController.getUserReviews);

// Protected routes (Admin)
reviewRoutes.get('/admin/all', requirePermission('manage_reviews'), reviewController.getAllReviews);
reviewRoutes.patch('/admin/:id/status', requirePermission('manage_reviews'), reviewController.updateReviewStatus);


/**
 * @file review.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { ReviewController } from './review.controller';
import { ReviewRepository } from '../../infrastructure/repositories/review.repository';
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case';
import { GetProductReviewsUseCase } from '../../application/use-cases/get-product-reviews.use-case';
import { authenticate } from '@shared/middleware/auth.middleware';

const reviewRepo = new ReviewRepository();
const createReviewUseCase = new CreateReviewUseCase(reviewRepo);
const getProductReviewsUseCase = new GetProductReviewsUseCase(reviewRepo);
const reviewController = new ReviewController(createReviewUseCase, getProductReviewsUseCase);

export const reviewRoutes = Router();

// Public routes
reviewRoutes.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
reviewRoutes.use(authenticate);
reviewRoutes.post('/', reviewController.createReview);

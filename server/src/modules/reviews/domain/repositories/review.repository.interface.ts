/**
 * @file review.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Review } from '../entities/review.entity';

export interface IReviewRepository {
  create(review: Review): Promise<Review>;
  findByProductId(productId: string, options: { skip: number; limit: number }): Promise<{ reviews: Review[]; total: number }>;
  findByUserIdAndProductId(userId: string, productId: string): Promise<Review | null>;
  calculateAverageRating(productId: string): Promise<{ average: number; count: number }>;
}

/**
 * @file review.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Review } from '../entities/review.entity';

export interface IReviewRepository {
  create(review: Review): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  update(review: Review): Promise<Review>;
  delete(id: string): Promise<void>;
  findByProductId(productId: string, options: { skip: number; limit: number }): Promise<{ reviews: Review[]; total: number }>;
  findAll(options: { skip: number; limit: number; status?: string; search?: string }): Promise<{ reviews: any[]; total: number; counts?: { all: number; pending: number; approved: number; rejected: number } }>;
  findByUserId(userId: string, options: { skip: number; limit: number }): Promise<{ reviews: Review[]; total: number }>;
  findByUserIdAndProductId(userId: string, productId: string): Promise<Review | null>;
  calculateAverageRating(productId: string): Promise<{ average: number; count: number }>;
}

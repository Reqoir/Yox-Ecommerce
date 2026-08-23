/**
 * @file update-review-status.use-case.ts
 * @layer Application
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewStatus } from '../../domain/entities/review.entity';

export class UpdateReviewStatusUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(reviewId: string, status: ReviewStatus) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.status === status) {
      return review.toJSON();
    }

    // Since we don't have an updateStatus method on the entity directly that mutates and we can just pass updated to repo
    const updatedReview = await this.reviewRepository.update(Object.assign(review, { status }));
    
    // Also, if a product changes from pending to approved, its average rating will automatically be calculated correctly next time it's fetched since calculateAverageRating only queries APPROVED
    
    return updatedReview.toJSON();
  }
}

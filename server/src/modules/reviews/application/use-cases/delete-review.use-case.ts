/**
 * @file delete-review.use-case.ts
 * @layer Application
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

export class DeleteReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await this.reviewRepository.delete(reviewId);

    // Recalculate product rating and review count
    try {
      const { average, count } = await this.reviewRepository.calculateAverageRating(review.productId);
      await ProductModel.findByIdAndUpdate(review.productId, {
        averageRating: average,
        reviewCount: count,
      });
    } catch {
      // Ignore rating calculation errors
    }
  }
}

/**
 * @file get-user-reviews.use-case.ts
 * @layer Application
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';

export class GetUserReviewsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { reviews, total } = await this.reviewRepository.findByUserId(userId, { skip, limit });
    
    return {
      reviews: reviews.map((r) => r.toJSON()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

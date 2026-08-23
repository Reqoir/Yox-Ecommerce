/**
 * @file get-all-reviews.use-case.ts
 * @layer Application
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';

export class GetAllReviewsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const { reviews, total } = await this.reviewRepository.findAll({ skip, limit, status });
    return {
      reviews: reviews.map((r) => r.toJSON()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

/**
 * @file get-all-reviews.use-case.ts
 * @layer Application
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';

export class GetAllReviewsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(page: number, limit: number, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const { reviews, total, counts } = await this.reviewRepository.findAll({ skip, limit, status, search });
    return {
      reviews: reviews.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      counts: counts || { all: total, pending: 0, approved: total, rejected: 0 },
    };
  }
}

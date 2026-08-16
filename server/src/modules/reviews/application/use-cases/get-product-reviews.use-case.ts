/**
 * @file get-product-reviews.use-case.ts
 * @layer Application › Use Cases
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { GetProductReviewsQueryDTO } from '../dtos/review.dto';
import { UserModel } from '../../../users/infrastructure/models/user.model';

export class GetProductReviewsUseCase {
  constructor(private reviewRepository: IReviewRepository) {}

  async execute(dto: GetProductReviewsQueryDTO): Promise<any> {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const { reviews, total } = await this.reviewRepository.findByProductId(dto.productId, { skip, limit });

    // Populate user info (like name) for the frontend
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        const r = review.toJSON();
        const user = await UserModel.findById(r.userId).select('fullName avatar').lean();
        return {
          ...r,
          user: user ? { fullName: user.fullName, avatar: (user as any).avatar } : { fullName: 'Anonymous' }
        };
      })
    );

    return {
      data: populatedReviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

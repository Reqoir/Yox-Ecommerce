/**
 * @file create-review.use-case.ts
 * @layer Application › Use Cases
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { CreateReviewDTO } from '../dtos/review.dto';
import { Review } from '../../domain/entities/review.entity';
import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

export class CreateReviewUseCase {
  constructor(private reviewRepository: IReviewRepository) {}

  async execute(dto: CreateReviewDTO): Promise<any> {
    // 1. Check if the user has already reviewed this product
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(dto.userId, dto.productId);
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    // 2. Validate that the user actually purchased the product AND it was delivered
    const hasPurchased = await OrderModel.exists({
      userId: dto.userId,
      orderStatus: 'DELIVERED',
      'items.productId': dto.productId
    });

    if (!hasPurchased) {
      throw new Error('FORBIDDEN: You can only review products you have purchased and received.');
    }

    // 3. Create the review
    const review = Review.create({
      productId: dto.productId,
      userId: dto.userId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      status: 'APPROVED'
    });

    const savedReview = await this.reviewRepository.create(review);

    // 4. Update the Product's average rating and review count
    const { average, count } = await this.reviewRepository.calculateAverageRating(dto.productId);
    await ProductModel.findByIdAndUpdate(dto.productId, {
      averageRating: average,
      reviewCount: count
    });

    return savedReview.toJSON();
  }
}

/**
 * @file create-review.use-case.ts
 * @layer Application › Use Cases
 */

import mongoose from 'mongoose';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { CreateReviewDTO } from '../dtos/review.dto';
import { Review } from '../../domain/entities/review.entity';
import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { NotificationService } from '../../../notifications/application/services/notification.service';

export class CreateReviewUseCase {
  constructor(private reviewRepository: IReviewRepository) {}

  async execute(dto: CreateReviewDTO): Promise<any> {
    // 1. Check if the user has already reviewed this product
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(dto.userId, dto.productId);
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    // 2. Validate that the user actually purchased the product AND it was delivered
    const userIds: any[] = [String(dto.userId)];
    if (mongoose.Types.ObjectId.isValid(dto.userId)) {
      userIds.push(new mongoose.Types.ObjectId(dto.userId));
    }

    const productIds: any[] = [String(dto.productId)];
    if (mongoose.Types.ObjectId.isValid(dto.productId)) {
      productIds.push(new mongoose.Types.ObjectId(dto.productId));
    }

    const userOrders = await OrderModel.find({
      userId: { $in: userIds },
      'items.productId': { $in: productIds },
    }).lean();

    if (userOrders.length === 0) {
      throw new Error('Only verified buyers who have purchased this product can write a review.');
    }

    const hasDelivered = userOrders.some((o) => o.orderStatus === 'DELIVERED');
    if (!hasDelivered) {
      throw new Error('You can review this product once your order has been delivered.');
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

    // 5. 🔔 Real-time staff notification for new review
    try {
      const product = await ProductModel.findById(dto.productId).select('name').lean();
      const productName = (product as any)?.name || 'Product';
      await NotificationService.getInstance().notify({
        userId: null,
        type: 'NEW_REVIEW',
        title: `⭐ New ${savedReview.rating}★ Review!`,
        message: `New review on "${productName}": "${savedReview.title || savedReview.comment?.substring(0, 50) || `Rated ${savedReview.rating} stars`}"`,
        metadata: {
          reviewId: savedReview.id,
          productId: dto.productId,
          productName,
          rating: savedReview.rating,
          title: savedReview.title,
          comment: savedReview.comment,
        },
      });
    } catch {
      // Notification errors should not block review creation
    }

    return savedReview.toJSON();
  }
}

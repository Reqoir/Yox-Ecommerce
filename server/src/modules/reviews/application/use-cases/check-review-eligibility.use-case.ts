/**
 * @file check-review-eligibility.use-case.ts
 * @layer Application › Use Cases
 */

import mongoose from 'mongoose';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { OrderModel } from '../../../orders/infrastructure/models/order.model';

export interface CheckReviewEligibilityDTO {
  userId: string;
  productId: string;
}

export interface ReviewEligibilityResult {
  canReview: boolean;
  hasPurchased: boolean;
  isDelivered: boolean;
  alreadyReviewed: boolean;
  existingReview?: any;
  reason?: 'ALREADY_REVIEWED' | 'NOT_PURCHASED' | 'NOT_DELIVERED';
}

export class CheckReviewEligibilityUseCase {
  constructor(private reviewRepository: IReviewRepository) {}

  async execute(dto: CheckReviewEligibilityDTO): Promise<ReviewEligibilityResult> {
    // 1. Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(dto.userId, dto.productId);
    if (existingReview) {
      return {
        canReview: false,
        hasPurchased: true,
        isDelivered: true,
        alreadyReviewed: true,
        existingReview: existingReview.toJSON(),
        reason: 'ALREADY_REVIEWED',
      };
    }

    // 2. Query orders containing this product
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
      return {
        canReview: false,
        hasPurchased: false,
        isDelivered: false,
        alreadyReviewed: false,
        reason: 'NOT_PURCHASED',
      };
    }

    const hasDelivered = userOrders.some((o) => o.orderStatus === 'DELIVERED');
    if (!hasDelivered) {
      return {
        canReview: false,
        hasPurchased: true,
        isDelivered: false,
        alreadyReviewed: false,
        reason: 'NOT_DELIVERED',
      };
    }

    return {
      canReview: true,
      hasPurchased: true,
      isDelivered: true,
      alreadyReviewed: false,
    };
  }
}

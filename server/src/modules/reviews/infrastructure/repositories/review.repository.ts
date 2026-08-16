/**
 * @file review.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { ReviewModel } from '../models/review.model';

export class ReviewRepository implements IReviewRepository {
  async create(review: Review): Promise<Review> {
    const data = review.toJSON();
    const doc = new ReviewModel({
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      status: data.status,
    });
    const saved = await doc.save();
    return Review.create({
      productId: saved.productId,
      userId: saved.userId,
      rating: saved.rating,
      title: saved.title,
      comment: saved.comment,
      status: saved.status,
    }, saved._id.toString());
  }

  async findByProductId(productId: string, options: { skip: number; limit: number }): Promise<{ reviews: Review[]; total: number }> {
    const [docs, total] = await Promise.all([
      ReviewModel.find({ productId, status: 'APPROVED' })
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      ReviewModel.countDocuments({ productId, status: 'APPROVED' })
    ]);

    const reviews = docs.map(doc => Review.create({
      productId: doc.productId,
      userId: doc.userId,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
    }, doc._id.toString()));

    return { reviews, total };
  }

  async findByUserIdAndProductId(userId: string, productId: string): Promise<Review | null> {
    const doc = await ReviewModel.findOne({ userId, productId }).lean();
    if (!doc) return null;
    return Review.create({
      productId: doc.productId,
      userId: doc.userId,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
    }, doc._id.toString());
  }

  async calculateAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const result = await ReviewModel.aggregate([
      { $match: { productId, status: 'APPROVED' } },
      {
        $group: {
          _id: '$productId',
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (result.length === 0) {
      return { average: 0, count: 0 };
    }
    return { average: Math.round(result[0].average * 10) / 10, count: result[0].count };
  }
}

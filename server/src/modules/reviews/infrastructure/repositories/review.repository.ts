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

  async findById(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findById(id).lean();
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

  async update(review: Review): Promise<Review> {
    const data = review.toJSON();
    const doc = await ReviewModel.findByIdAndUpdate(
      review.id,
      {
        status: data.status,
      },
      { new: true, lean: true }
    );
    
    if (!doc) throw new Error('Review not found');

    return Review.create({
      productId: doc.productId,
      userId: doc.userId,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
    }, doc._id.toString());
  }

  async findAll(options: { skip: number; limit: number; status?: string }): Promise<{ reviews: Review[]; total: number }> {
    const query: any = {};
    if (options.status) {
      query.status = options.status;
    }

    const [docs, total] = await Promise.all([
      ReviewModel.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .populate('productId', 'name images')
        .populate('userId', 'firstName lastName email')
        .lean(),
      ReviewModel.countDocuments(query)
    ]);

    const reviews = docs.map((doc: any) => Review.create({
      productId: doc.productId?._id ? doc.productId._id.toString() : doc.productId,
      userId: doc.userId?._id ? doc.userId._id.toString() : doc.userId,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
    }, doc._id.toString()));

    // Attach populated data so it can be returned directly or used by presentation
    return { 
      reviews: reviews.map((r, i) => {
        const json = r.toJSON();
        return {
          ...r,
          toJSON: () => ({
            ...json,
            product: docs[i].productId,
            user: docs[i].userId
          })
        } as unknown as Review;
      }), 
      total 
    };
  }

  async findByUserId(userId: string, options: { skip: number; limit: number }): Promise<{ reviews: Review[]; total: number }> {
    const [docs, total] = await Promise.all([
      ReviewModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .populate('productId', 'name images')
        .lean(),
      ReviewModel.countDocuments({ userId })
    ]);

    const reviews = docs.map((doc: any) => Review.create({
      productId: doc.productId?._id ? doc.productId._id.toString() : doc.productId,
      userId: doc.userId,
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      status: doc.status,
    }, doc._id.toString()));

    return { 
      reviews: reviews.map((r, i) => {
        const json = r.toJSON();
        return {
          ...r,
          toJSON: () => ({
            ...json,
            product: docs[i].productId
          })
        } as unknown as Review;
      }), 
      total 
    };
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

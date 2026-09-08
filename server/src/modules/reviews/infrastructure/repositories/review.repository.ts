/**
 * @file review.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review } from '../../domain/entities/review.entity';
import { ReviewModel } from '../models/review.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';

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
        updatedAt: new Date(),
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

  async delete(id: string): Promise<void> {
    await ReviewModel.findByIdAndDelete(id).exec();
  }

  async findAll(options: {
    skip: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{
    reviews: any[];
    total: number;
    counts: { all: number; pending: number; approved: number; rejected: number };
  }> {
    const query: any = {};
    if (options.status && options.status !== 'ALL') {
      query.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      const [matchedProducts, matchedUsers] = await Promise.all([
        ProductModel.find({ name: searchRegex }).select('_id').lean(),
        UserModel.find({ $or: [{ fullName: searchRegex }, { email: searchRegex }] }).select('_id').lean(),
      ]);

      const matchedProductIds = matchedProducts.map((p: any) => p._id.toString());
      const matchedUserIds = matchedUsers.map((u: any) => u._id.toString());

      query.$or = [
        { title: searchRegex },
        { comment: searchRegex },
        { productId: { $in: matchedProductIds } },
        { userId: { $in: matchedUserIds } },
      ];
    }

    const [docs, total, countsResult] = await Promise.all([
      ReviewModel.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      ReviewModel.countDocuments(query),
      ReviewModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const c of countsResult) {
      const cnt = c.count || 0;
      counts.all += cnt;
      if (c._id === 'PENDING') counts.pending = cnt;
      else if (c._id === 'APPROVED') counts.approved = cnt;
      else if (c._id === 'REJECTED') counts.rejected = cnt;
    }

    // Resolve products and users in batch
    const productIds = Array.from(new Set(docs.map((d: any) => String(d.productId)).filter(Boolean)));
    const userIds = Array.from(new Set(docs.map((d: any) => String(d.userId)).filter(Boolean)));

    const [products, users] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } }).select('name thumbnail slug').lean(),
      UserModel.find({ _id: { $in: userIds } }).select('fullName email phone profileImage').lean(),
    ]);

    const productMap = new Map(products.map((p: any) => [String(p._id), p]));
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    const reviews = docs.map((doc: any) => {
      const p = productMap.get(String(doc.productId));
      const u = userMap.get(String(doc.userId));
      return {
        id: doc._id.toString(),
        productId: doc.productId,
        userId: doc.userId,
        rating: doc.rating,
        title: doc.title,
        comment: doc.comment,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        product: p ? {
          id: p._id.toString(),
          name: p.name,
          thumbnail: p.thumbnail,
          slug: p.slug,
        } : null,
        user: u ? {
          id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          profileImage: u.profileImage,
        } : null,
      };
    });

    return { reviews, total, counts };
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

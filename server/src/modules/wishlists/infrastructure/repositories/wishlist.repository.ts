/**
 * @file wishlist.repository.ts
 * @layer Infrastructure
 */

import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';
import { Wishlist } from '../../domain/entities/wishlist.entity';
import { WishlistModel } from '../models/wishlist.model';

export class WishlistRepository implements IWishlistRepository {
  async findByUserId(userId: string): Promise<Wishlist | null> {
    const doc = await WishlistModel.findOne({ userId }).lean();
    if (!doc) return null;
    return Wishlist.create(
      {
        userId: doc.userId.toString(),
        items: doc.items.map((i: any) => ({
          productId: i.productId.toString(),
          color: i.color || null,
          addedAt: i.addedAt,
        })),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      doc._id.toString()
    );
  }

  async save(wishlist: Wishlist): Promise<Wishlist> {
    const data = wishlist.toJSON();
    const doc = await WishlistModel.findOneAndUpdate(
      { userId: data.userId },
      { items: data.items },
      { new: true, upsert: true, lean: true }
    );
    
    if (!doc) throw new Error('Failed to save wishlist');

    return Wishlist.create(
      {
        userId: doc.userId.toString(),
        items: doc.items.map((i: any) => ({
          productId: i.productId.toString(),
          color: i.color || null,
          addedAt: i.addedAt,
        })),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      doc._id.toString()
    );
  }

  async findByUserIdPopulated(userId: string): Promise<any> {
    return WishlistModel.findOne({ userId })
      .populate('items.productId')
      .lean();
  }
}

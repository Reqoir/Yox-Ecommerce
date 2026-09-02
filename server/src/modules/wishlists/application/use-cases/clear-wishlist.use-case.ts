/**
 * @file clear-wishlist.use-case.ts
 * @layer Application
 */

import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';
import { Wishlist } from '../../domain/entities/wishlist.entity';

export class ClearWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string) {
    let wishlist = await this.wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      wishlist = Wishlist.create({ userId, items: [] });
    } else {
      wishlist = Wishlist.create(
        {
          userId,
          items: [],
          createdAt: wishlist.toJSON().createdAt,
          updatedAt: new Date(),
        },
        wishlist.id
      );
    }

    const saved = await this.wishlistRepository.save(wishlist);
    return { ...saved.toJSON(), items: [] };
  }
}

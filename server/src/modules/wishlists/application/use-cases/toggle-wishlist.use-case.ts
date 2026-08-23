/**
 * @file toggle-wishlist.use-case.ts
 * @layer Application
 */

import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';
import { Wishlist } from '../../domain/entities/wishlist.entity';

export class ToggleWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string, productId: string) {
    let wishlist = await this.wishlistRepository.findByUserId(userId);
    
    if (!wishlist) {
      wishlist = Wishlist.create({ userId, items: [] });
    }

    if (wishlist.hasItem(productId)) {
      wishlist.removeItem(productId);
    } else {
      wishlist.addItem(productId);
    }

    const saved = await this.wishlistRepository.save(wishlist);
    return saved.toJSON();
  }
}

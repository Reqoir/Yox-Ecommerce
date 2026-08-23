/**
 * @file wishlist.repository.interface.ts
 * @layer Domain
 */

import { Wishlist } from '../entities/wishlist.entity';

export interface IWishlistRepository {
  findByUserId(userId: string): Promise<Wishlist | null>;
  save(wishlist: Wishlist): Promise<Wishlist>;
  findByUserIdPopulated(userId: string): Promise<any>;
}

/**
 * @file get-wishlist.use-case.ts
 * @layer Application
 */

import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';

export class GetWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string) {
    const wishlist = await this.wishlistRepository.findByUserIdPopulated(userId);
    if (!wishlist) {
      return { items: [] };
    }
    
    // Map populated products to simplify frontend usage
    const populatedItems = wishlist.items.map((item: any) => ({
      productId: item.productId?._id ? item.productId._id.toString() : item.productId,
      productName: item.productId?.name,
      productPrice: item.productId?.price,
      productImage: item.productId?.images?.[0]?.url || item.productId?.images?.[0] || '/images/product-1.jpeg',
      productSlug: item.productId?.slug,
      productStock: item.productId?.stock,
      addedAt: item.addedAt,
    }));

    return { ...wishlist, items: populatedItems, id: wishlist._id.toString() };
  }
}

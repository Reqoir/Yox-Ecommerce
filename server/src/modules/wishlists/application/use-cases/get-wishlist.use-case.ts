/**
 * @file get-wishlist.use-case.ts
 * @layer Application
 */

import { IWishlistRepository } from '../../domain/repositories/wishlist.repository.interface';
import { ProductVariantModel } from '../../../products/infrastructure/models/product-variant.model';
import { CategoryModel } from '../../../categories/infrastructure/models/category.model';
import { Types } from 'mongoose';

export class GetWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}

  async execute(userId: string) {
    const wishlist = await this.wishlistRepository.findByUserIdPopulated(userId);
    if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
      return { id: wishlist?._id?.toString() || null, userId, items: [] };
    }

    // Filter valid products that still exist in database
    const validItems = wishlist.items.filter((item: any) => item.productId && item.productId._id);
    const productIds = validItems.map((item: any) => item.productId._id.toString());
    const categoryIds = validItems
      .map((item: any) => item.productId.categoryId)
      .filter((cid: any) => cid && (Types.ObjectId.isValid(cid) || typeof cid === 'string'));

    // Batch query active variants and categories
    const [variants, categories] = await Promise.all([
      ProductVariantModel.find({ productId: { $in: productIds }, isActive: true }).lean(),
      CategoryModel.find({ _id: { $in: categoryIds } }).select('_id name').lean(),
    ]);

    const variantMap = new Map<string, any[]>();
    for (const v of variants) {
      const pId = v.productId.toString();
      if (!variantMap.has(pId)) variantMap.set(pId, []);
      variantMap.get(pId)!.push(v);
    }

    const categoryMap = new Map<string, string>();
    for (const c of categories) {
      categoryMap.set(c._id.toString(), c.name);
    }

    // Map populated products with color-specific variant awareness
    const populatedItems = validItems.map((item: any) => {
      const p = item.productId;
      const pId = p._id.toString();
      const pVariants = variantMap.get(pId) || [];
      const itemColor = item.color ? item.color.trim() : null;

      // Find variant matching specific color if specified
      let matchedVariant = itemColor
        ? pVariants.find(v => v.color && v.color.trim().toLowerCase() === itemColor.toLowerCase())
        : null;

      if (!matchedVariant) {
        matchedVariant = pVariants.find(v => v.isDefault) || pVariants[0] || null;
      }

      const minPrice = pVariants.length > 0 ? Math.min(...pVariants.map(v => v.price)) : 0;
      const totalStock = matchedVariant
        ? (matchedVariant.stock || 0)
        : pVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const categoryName = p.categoryId ? categoryMap.get(p.categoryId.toString()) || 'Apparel' : 'Apparel';

      const variantImage = matchedVariant?.images?.find((img: string) => img && img.trim() !== '') || pVariants[0]?.images?.[0];

      return {
        id: itemColor ? `${pId}__${itemColor}` : pId,
        productId: pId,
        color: itemColor || matchedVariant?.color || null,
        productName: p.name,
        productSlug: p.slug,
        productPrice: matchedVariant ? matchedVariant.price : minPrice,
        productComparePrice: matchedVariant?.comparePrice || null,
        productImage: variantImage || p.thumbnail || '/images/product-1.jpeg',
        productCategory: categoryName,
        productTag: p.tag || null,
        productFit: p.fit || null,
        productStock: totalStock,
        inStock: totalStock > 0,
        addedAt: item.addedAt,
      };
    });

    return {
      id: wishlist._id ? wishlist._id.toString() : null,
      userId: wishlist.userId ? wishlist.userId.toString() : userId,
      items: populatedItems,
    };
  }
}

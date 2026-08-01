/**
 * @file cart.use-cases.ts
 * @layer Application
 * 
 * Application logic for Cart operations.
 */

import { IUseCase } from '../../../../core/application/use-cases/base.use-case.interface';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { AddCartItemDTO, UpdateCartItemDTO, CartResponseDTO, CartItemResponseDTO } from '../dtos/cart.dto';

// --- Mappers ---
async function mapToCartResponseDTO(
  cart: Cart,
  variantRepo?: IProductVariantRepository,
  productRepo?: IProductRepository
): Promise<CartResponseDTO> {
  const enrichedItems: CartItemResponseDTO[] = [];

  for (const item of cart.items) {
    let productId: string | undefined;
    let name: string | undefined;
    let slug: string | undefined;
    let image: string | undefined;
    let color: string | undefined;
    let size: string | undefined;
    let stock: number | undefined;
    let comparePrice: number | null | undefined;

    if (variantRepo) {
      try {
        const variant = await variantRepo.findById(item.variantId);
        if (variant) {
          productId = variant.productId;
          color = variant.color || undefined;
          size = variant.size || undefined;
          stock = variant.stock;
          comparePrice = variant.comparePrice || null;
          image = variant.images?.[0];

          if (productRepo && variant.productId) {
            const product = await productRepo.findById(variant.productId);
            if (product) {
              name = product.name;
              slug = product.slug;
              if (!image && product.thumbnail) {
                image = product.thumbnail;
              }
            }
          }
        }
      } catch (error) {
        // Continue with fallback values if lookup fails
      }
    }

    enrichedItems.push({
      variantId: item.variantId,
      productId,
      name: name || `Product Variant (${item.variantId})`,
      slug,
      image: image || '/images/default-product.png',
      color: color || 'Default',
      size: size || 'Standard',
      stock: stock !== undefined ? stock : 99,
      price: item.price,
      comparePrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    });
  }

  return {
    id: cart.id,
    userId: cart.userId,
    items: enrichedItems,
    totalItems: cart.totalItems,
    totalAmount: cart.totalAmount,
    couponId: cart.couponId,
    discountAmount: cart.discountAmount,
    finalAmount: cart.finalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export class GetCartUseCase implements IUseCase<string, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo?: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(userId: string): Promise<CartResponseDTO> {
    let cart = await this.cartRepo.findByUserId(userId);
    if (!cart) {
      cart = Cart.create({ userId, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return mapToCartResponseDTO(cart, this.variantRepo, this.productRepo);
  }
}

export class AddItemToCartUseCase implements IUseCase<{ userId: string; data: AddCartItemDTO }, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(input: { userId: string; data: AddCartItemDTO }): Promise<CartResponseDTO> {
    const variant = await this.variantRepo.findById(input.data.variantId);
    if (!variant) throw new Error('Product variant not found');
    if (!variant.isActive) throw new Error('Product variant is not active');

    let cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) {
      cart = Cart.create({ userId: input.userId, items: [] });
    }

    const existingItem = cart.items.find(i => i.variantId === input.data.variantId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = currentQty + input.data.quantity;

    if (variant.stock < requestedTotalQty) {
      throw new Error(`Insufficient stock. Available stock is ${variant.stock}.`);
    }

    cart.addItem({
      variantId: input.data.variantId,
      quantity: input.data.quantity,
      price: variant.price,
    });

    const savedCart = await this.cartRepo.save(cart);
    return mapToCartResponseDTO(savedCart, this.variantRepo, this.productRepo);
  }
}

export class UpdateCartItemUseCase implements IUseCase<{ userId: string; variantId: string; data: UpdateCartItemDTO }, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo?: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(input: { userId: string; variantId: string; data: UpdateCartItemDTO }): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new Error('Cart not found');

    if (this.variantRepo && input.data.quantity > 0) {
      const variant = await this.variantRepo.findById(input.variantId);
      if (!variant) throw new Error('Product variant not found');
      if (!variant.isActive) throw new Error('Product variant is not active');
      if (variant.stock < input.data.quantity) {
        throw new Error(`Cannot update quantity to ${input.data.quantity}. Available stock is ${variant.stock}.`);
      }
    }

    cart.updateItemQuantity(input.variantId, input.data.quantity);
    const savedCart = await this.cartRepo.save(cart);

    return mapToCartResponseDTO(savedCart, this.variantRepo, this.productRepo);
  }
}

export class RemoveCartItemUseCase implements IUseCase<{ userId: string; variantId: string }, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo?: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(input: { userId: string; variantId: string }): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new Error('Cart not found');

    cart.removeItem(input.variantId);
    const savedCart = await this.cartRepo.save(cart);

    return mapToCartResponseDTO(savedCart, this.variantRepo, this.productRepo);
  }
}

export class ClearCartUseCase implements IUseCase<string, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo?: IProductVariantRepository,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(userId: string): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(userId);
    if (!cart) throw new Error('Cart not found');

    cart.clear();
    const savedCart = await this.cartRepo.save(cart);

    return mapToCartResponseDTO(savedCart, this.variantRepo, this.productRepo);
  }
}

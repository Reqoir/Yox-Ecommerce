/**
 * @file cart.use-cases.ts
 * @layer Application
 * 
 * Application logic for Cart operations.
 */

import { IUseCase } from '../../../../core/application/use-cases/base.use-case.interface';
import { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { AddCartItemDTO, UpdateCartItemDTO, CartResponseDTO } from '../dtos/cart.dto';

// --- Mappers ---
function mapToCartResponseDTO(cart: Cart): CartResponseDTO {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map(i => ({
      variantId: i.variantId,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
    })),
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
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(userId: string): Promise<CartResponseDTO> {
    let cart = await this.cartRepo.findByUserId(userId);
    if (!cart) {
      cart = Cart.create({ userId, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return mapToCartResponseDTO(cart);
  }
}

export class AddItemToCartUseCase implements IUseCase<{ userId: string; data: AddCartItemDTO }, CartResponseDTO> {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(input: { userId: string; data: AddCartItemDTO }): Promise<CartResponseDTO> {
    const variant = await this.variantRepo.findById(input.data.variantId);
    if (!variant) throw new Error('Product variant not found');
    if (!variant.isActive) throw new Error('Product variant is not active');
    if (variant.stock < input.data.quantity) throw new Error('Insufficient stock');

    let cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) {
      cart = Cart.create({ userId: input.userId, items: [] });
    }

    cart.addItem({
      variantId: input.data.variantId,
      quantity: input.data.quantity,
      price: variant.price, // Fetch the authoritative price
    });

    const savedCart = await this.cartRepo.save(cart);
    return mapToCartResponseDTO(savedCart);
  }
}

export class UpdateCartItemUseCase implements IUseCase<{ userId: string; variantId: string; data: UpdateCartItemDTO }, CartResponseDTO> {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(input: { userId: string; variantId: string; data: UpdateCartItemDTO }): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new Error('Cart not found');

    cart.updateItemQuantity(input.variantId, input.data.quantity);
    const savedCart = await this.cartRepo.save(cart);
    
    return mapToCartResponseDTO(savedCart);
  }
}

export class RemoveCartItemUseCase implements IUseCase<{ userId: string; variantId: string }, CartResponseDTO> {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(input: { userId: string; variantId: string }): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(input.userId);
    if (!cart) throw new Error('Cart not found');

    cart.removeItem(input.variantId);
    const savedCart = await this.cartRepo.save(cart);
    
    return mapToCartResponseDTO(savedCart);
  }
}

export class ClearCartUseCase implements IUseCase<string, CartResponseDTO> {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(userId: string): Promise<CartResponseDTO> {
    const cart = await this.cartRepo.findByUserId(userId);
    if (!cart) throw new Error('Cart not found');

    cart.clear();
    const savedCart = await this.cartRepo.save(cart);
    
    return mapToCartResponseDTO(savedCart);
  }
}

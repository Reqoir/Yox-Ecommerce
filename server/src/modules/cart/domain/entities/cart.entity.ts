/**
 * @file cart.entity.ts
 * @layer Domain
 * 
 * Defines the Cart business entity and its rules.
 */

import { BaseEntity, EntityProps } from '../../../../core/domain/entities/base.entity';

export interface CartItemProps {
  variantId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CartProps extends EntityProps {
  userId: string;
  items: CartItemProps[];
  totalItems: number;
  totalAmount: number;
  couponId?: string | null;
  discountAmount?: number | null;
  finalAmount: number;
}

export class Cart extends BaseEntity<CartProps> {
  private constructor(props: CartProps) {
    super(props);
  }

  get userId(): string { return this._props.userId; }
  get items(): CartItemProps[] { return [...this._props.items]; }
  get totalItems(): number { return this._props.totalItems; }
  get totalAmount(): number { return this._props.totalAmount; }
  get couponId(): string | null | undefined { return this._props.couponId; }
  get discountAmount(): number | null | undefined { return this._props.discountAmount; }
  get finalAmount(): number { return this._props.finalAmount; }

  public static create(props: Omit<CartProps, 'id' | 'createdAt' | 'updatedAt' | 'totalItems' | 'totalAmount' | 'finalAmount'>): Cart {
    const cart = new Cart({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalItems: 0,
      totalAmount: 0,
      finalAmount: 0,
      ...props
    });
    cart.calculateTotals();
    return cart;
  }

  public static reconstitute(props: CartProps): Cart {
    return new Cart(props);
  }

  public addItem(item: Omit<CartItemProps, 'subtotal'>): void {
    const existingItemIndex = this._props.items.findIndex(i => i.variantId === item.variantId);

    if (existingItemIndex >= 0) {
      const existingItem = this._props.items[existingItemIndex];
      existingItem.quantity += item.quantity;
      existingItem.price = item.price; // Update to latest price
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      this._props.items.push({
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
      });
    }

    this.calculateTotals();
  }

  public updateItemQuantity(variantId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(variantId);
      return;
    }

    const item = this._props.items.find(i => i.variantId === variantId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.quantity = quantity;
    item.subtotal = item.quantity * item.price;
    this.calculateTotals();
  }

  public removeItem(variantId: string): void {
    this._props.items = this._props.items.filter(i => i.variantId !== variantId);
    this.calculateTotals();
  }

  public clear(): void {
    this._props.items = [];
    this.calculateTotals();
  }

  public applyCoupon(couponId: string, discountAmount: number): void {
    this._props.couponId = couponId;
    this._props.discountAmount = discountAmount;
    this.calculateTotals();
  }

  public removeCoupon(): void {
    this._props.couponId = null;
    this._props.discountAmount = 0;
    this.calculateTotals();
  }

  private calculateTotals(): void {
    this._props.totalItems = this._props.items.reduce((sum, item) => sum + item.quantity, 0);
    this._props.totalAmount = this._props.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    const discount = this._props.discountAmount || 0;
    this._props.finalAmount = Math.max(0, this._props.totalAmount - discount);
    
    this._props.updatedAt = new Date();
  }
}

/**
 * @file wishlist.entity.ts
 * @layer Domain
 */

export interface WishlistItemProps {
  productId: string;
  addedAt: Date;
}

export interface WishlistProps {
  userId: string;
  items: WishlistItemProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wishlist {
  private constructor(private readonly props: WishlistProps, public readonly id?: string) {}

  static create(props: WishlistProps, id?: string): Wishlist {
    return new Wishlist(props, id);
  }

  get userId() { return this.props.userId; }
  get items() { return this.props.items; }

  hasItem(productId: string): boolean {
    return this.props.items.some(item => item.productId === productId);
  }

  addItem(productId: string): void {
    if (!this.hasItem(productId)) {
      this.props.items.push({ productId, addedAt: new Date() });
    }
  }

  removeItem(productId: string): void {
    this.props.items = this.props.items.filter(item => item.productId !== productId);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.props.userId,
      items: this.props.items,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

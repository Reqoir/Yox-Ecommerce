/**
 * @file wishlist.entity.ts
 * @layer Domain
 */

export interface WishlistItemProps {
  productId: string;
  color?: string | null;
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

  hasItem(productId: string, color?: string | null): boolean {
    const targetColor = color ? color.trim().toLowerCase() : null;
    return this.props.items.some(item => {
      if (item.productId !== productId) return false;
      const itemColor = item.color ? item.color.trim().toLowerCase() : null;
      if (!targetColor && !itemColor) return true;
      if (targetColor && itemColor) return targetColor === itemColor;
      return !targetColor || !itemColor;
    });
  }

  addItem(productId: string, color?: string | null): void {
    if (!this.hasItem(productId, color)) {
      this.props.items.push({ productId, color: color?.trim() || null, addedAt: new Date() });
    }
  }

  removeItem(productId: string, color?: string | null): void {
    const targetColor = color ? color.trim().toLowerCase() : null;
    this.props.items = this.props.items.filter(item => {
      if (item.productId !== productId) return true;
      const itemColor = item.color ? item.color.trim().toLowerCase() : null;
      if (targetColor && itemColor) {
        return itemColor !== targetColor;
      }
      return false;
    });
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

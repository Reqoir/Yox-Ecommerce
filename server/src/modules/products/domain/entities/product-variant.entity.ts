/**
 * @file product-variant.entity.ts
 * @layer Domain
 * 
 * Defines the core ProductVariant business entity and its rules.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface ProductVariantProps extends EntityProps {
  productId: string;
  sku: string;
  title: string;
  color: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  weight?: number | null;
  barcode?: string | null;
  images: string[];
  isDefault: boolean;
  isActive: boolean;
  size?: string | null;
}

export class ProductVariant extends BaseEntity<ProductVariantProps> {
  private constructor(props: ProductVariantProps) {
    super(props);
  }

  get productId(): string { return this._props.productId; }
  get sku(): string { return this._props.sku; }
  get title(): string { return this._props.title; }
  get color(): string { return this._props.color; }
  get price(): number { return this._props.price; }
  get comparePrice(): number | null | undefined { return this._props.comparePrice; }
  get stock(): number { return this._props.stock; }
  get images(): string[] { return this._props.images ? [...this._props.images] : []; }
  get isDefault(): boolean { return this._props.isDefault; }
  get isActive(): boolean { return this._props.isActive; }
  get size(): string | null | undefined { return this._props.size; }

  public static create(props: Omit<ProductVariantProps, 'id' | 'createdAt' | 'updatedAt'>): ProductVariant {
    return new ProductVariant({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props
    });
  }

  public static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  public reduceStock(amount: number): void {
    if (this._props.stock >= amount) {
      this._props.stock -= amount;
    } else {
      throw new Error('Insufficient stock');
    }
  }

  public increaseStock(amount: number): void {
    this._props.stock += amount;
  }
}

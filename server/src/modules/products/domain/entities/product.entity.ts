/**
 * @file product.entity.ts
 * @layer Domain
 * 
 * Defines the core Product business entity and its rules.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { ProductVariant } from './product-variant.entity';

export interface ProductProps extends EntityProps {
  name: string;
  slug: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  fit?: string | null;
  tag?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  salesCount: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  
  // Aggregate variants
  variants?: ProductVariant[];
}

export class Product extends BaseEntity<ProductProps> {
  private constructor(props: ProductProps) {
    super(props);
  }

  get name(): string { return this._props.name; }
  get slug(): string { return this._props.slug; }
  get categoryId(): string | null | undefined { return this._props.categoryId; }
  get subCategoryId(): string | null | undefined { return this._props.subCategoryId; }
  get brandId(): string | null | undefined { return this._props.brandId; }
  get shortDescription(): string | null | undefined { return this._props.shortDescription; }
  get description(): string | null | undefined { return this._props.description; }
  get thumbnail(): string | null | undefined { return this._props.thumbnail; }
  get fit(): string | null | undefined { return this._props.fit; }
  get tag(): string | null | undefined { return this._props.tag; }
  get isFeatured(): boolean { return this._props.isFeatured; }
  get isActive(): boolean { return this._props.isActive; }
  get salesCount(): number { return this._props.salesCount; }
  get seoTitle(): string | null | undefined { return this._props.seoTitle; }
  get seoDescription(): string | null | undefined { return this._props.seoDescription; }
  get variants(): ProductVariant[] | undefined { return this._props.variants; }

  public static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt' | 'salesCount'>): Product {
    return new Product({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      salesCount: 0,
      ...props
    });
  }

  public static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  public attachVariants(variants: ProductVariant[]): void {
    this._props.variants = variants;
  }

  public incrementSales(amount: number = 1): void {
    this._props.salesCount += amount;
  }
}

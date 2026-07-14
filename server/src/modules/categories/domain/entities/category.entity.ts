/**
 * @file category.entity.ts
 * @layer Domain
 * 
 * Defines the core Category business entity and its rules.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface CategoryProps extends EntityProps {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export class Category extends BaseEntity<CategoryProps> {
  private constructor(props: CategoryProps) {
    super(props);
  }

  get name(): string { return this._props.name; }
  get slug(): string { return this._props.slug; }
  get description(): string | null | undefined { return this._props.description; }
  get image(): string | null | undefined { return this._props.image; }
  get icon(): string | null | undefined { return this._props.icon; }
  get parentCategoryId(): string | null | undefined { return this._props.parentCategoryId; }
  get isActive(): boolean { return this._props.isActive; }
  get sortOrder(): number { return this._props.sortOrder; }
  get seoTitle(): string | null | undefined { return this._props.seoTitle; }
  get seoDescription(): string | null | undefined { return this._props.seoDescription; }

  public static create(props: Omit<CategoryProps, 'id' | 'createdAt' | 'updatedAt'>): Category {
    return new Category({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props
    });
  }

  public static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }
}

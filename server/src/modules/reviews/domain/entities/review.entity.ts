/**
 * @file review.entity.ts
 * @layer Domain › Entities
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface ReviewProps extends EntityProps {
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: string;
}

export class Review extends BaseEntity<ReviewProps> {
  private constructor(props: ReviewProps) {
    super(props);
  }

  get productId(): string { return this._props.productId; }
  get userId(): string { return this._props.userId; }
  get rating(): number { return this._props.rating; }
  get title(): string | null | undefined { return this._props.title; }
  get comment(): string | null | undefined { return this._props.comment; }
  get status(): string { return this._props.status; }

  public static create(
    props: Omit<ReviewProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string; createdAt?: Date; updatedAt?: Date; status?: string },
    id?: string
  ): Review {
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    return new Review({
      ...props,
      id: id || props.id || '',
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      status: props.status || 'APPROVED'
    });
  }
}

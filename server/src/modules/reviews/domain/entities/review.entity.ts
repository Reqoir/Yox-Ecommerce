/**
 * @file review.entity.ts
 * @layer Domain › Entities
 */

import { BaseEntity } from '@core/domain/entities/base.entity';

export interface ReviewProps {
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: string;
}

export class Review extends BaseEntity<ReviewProps> {
  private constructor(props: ReviewProps, id?: string) {
    super(props, id);
  }

  get productId(): string { return this._props.productId; }
  get userId(): string { return this._props.userId; }
  get rating(): number { return this._props.rating; }
  get title(): string | null | undefined { return this._props.title; }
  get comment(): string | null | undefined { return this._props.comment; }
  get status(): string { return this._props.status; }

  public static create(props: ReviewProps, id?: string): Review {
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    return new Review({
      ...props,
      status: props.status || 'APPROVED'
    }, id);
  }
}

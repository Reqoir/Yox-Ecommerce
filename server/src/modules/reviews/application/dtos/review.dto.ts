/**
 * @file review.dto.ts
 * @layer Application › DTOs
 */

export interface CreateReviewDTO {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface GetProductReviewsQueryDTO {
  productId: string;
  page?: number;
  limit?: number;
}

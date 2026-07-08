/**
 * @file pagination.dto.ts
 * @layer Application
 *
 * Pagination-related DTOs used by use cases and repositories.
 */

import type { PaginationMeta, PaginatedResult, SortOrder } from '@shared/types/common.types';

export interface PaginationQueryDTO {
  page: number;
  limit: number;
  sort: string;
  order: SortOrder;
  search?: string;
}

export interface PaginatedResponseDTO<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

/**
 * Convert the shared PaginatedResult into a DTO-friendly shape.
 */
export function toPaginatedResponseDTO<TDomain, TDTO>(
  result: PaginatedResult<TDomain>,
  mapper: (item: TDomain) => TDTO,
): PaginatedResponseDTO<TDTO> {
  return {
    items: result.data.map(mapper),
    meta: result.meta,
  };
}

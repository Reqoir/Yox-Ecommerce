/**
 * @file common.types.ts
 * @layer Shared
 *
 * Shared TypeScript types used across all layers.
 * These are plain TypeScript types — no framework dependencies.
 */

// ─── Identity ────────────────────────────────────────────────────────────────

/** MongoDB ObjectId string representation */
export type MongoId = string;

/** Generic ID type */
export type ID = string;

// ─── Sort ────────────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
  timestamp: string;
  stack?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Make specific properties of T optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties of T required */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Deep partial */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Nullable */
export type Nullable<T> = T | null;

/** Optional */
export type Optional<T> = T | undefined;

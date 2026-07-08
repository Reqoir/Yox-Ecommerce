/**
 * @file pagination.util.ts
 * @layer Shared › Utils
 *
 * Pagination helpers for parsing query params and building meta objects.
 */

import type { Request } from 'express';

import type { PaginationMeta, PaginationQuery, SortOrder } from '../types/common.types';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../constants/app.constants';

/**
 * Parse pagination parameters from an Express request query string.
 * Applies defaults and clamps values to safe ranges.
 */
export const parsePaginationQuery = (req: Request): PaginationQuery => {
  const page = Math.max(1, parseInt(String(req.query['page'] ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, parseInt(String(req.query['limit'] ?? DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT),
  );
  const sort = String(req.query['sort'] ?? 'createdAt');
  const order = (String(req.query['order'] ?? 'desc') as SortOrder) === 'asc' ? 'asc' : 'desc';
  const search = req.query['search'] ? String(req.query['search']) : undefined;

  return { page, limit, sort, order, search };
};

/**
 * Build a pagination meta object from raw counts.
 */
export const buildPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Calculate the number of documents to skip for MongoDB queries.
 */
export const calculateSkip = (page: number, limit: number): number => (page - 1) * limit;

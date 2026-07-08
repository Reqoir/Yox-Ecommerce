/**
 * @file app.constants.ts
 * @layer Shared › Constants
 *
 * Application-wide constants.
 * Centralises magic strings and configuration values.
 */

export const APP_NAME = 'YOX Ecommerce';

// ── API ───────────────────────────────────────────────────────────────────────
export const API_PREFIX = '/api';
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

// ── Tokens ───────────────────────────────────────────────────────────────────
export const BEARER_PREFIX = 'Bearer ';
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// ── Cache Keys (Redis) ────────────────────────────────────────────────────────
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  SESSION: (token: string) => `session:${token}`,
  BLACKLIST_TOKEN: (token: string) => `blacklist:${token}`,
} as const;

// ── Upload ────────────────────────────────────────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'yox/products',
  USERS: 'yox/users',
  CATEGORIES: 'yox/categories',
} as const;

// ── Validation ────────────────────────────────────────────────────────────────
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 2000;

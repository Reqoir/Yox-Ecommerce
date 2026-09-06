/**
 * @file cookie.helper.ts
 * @layer Shared › Utils
 *
 * Helpers for setting and clearing secure HttpOnly cookies.
 */

import { type Response, type CookieOptions } from 'express';
import { env } from '../../core/infrastructure/config/env';

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Base options for security
const baseCookieOptions: CookieOptions = {
  httpOnly: true, // Prevents XSS attacks (JS cannot read the cookie)
  secure: env.NODE_ENV === 'production', // Send over HTTPS only in production
  sameSite: 'lax', // Prevents CSRF attacks while allowing cross-port navigation on localhost
  path: '/', // Available everywhere in the app
};

/**
 * Sets the access and refresh tokens as secure HttpOnly cookies.
 */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  // Access Token (7 days to prevent annoying 15-minute logouts during development/admin use)
  const accessMaxAge = 7 * 24 * 60 * 60 * 1000;

  // Refresh Token (30 days)
  const refreshMaxAge = 30 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: accessMaxAge,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshMaxAge,
    path: '/',
  });
};

/**
 * Clears the authentication cookies (Logout).
 */
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/',
  });
  // Also clear legacy path and camelCase names if present
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/api/v1/auth/refresh',
  });
  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', baseCookieOptions);
};

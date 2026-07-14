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
  sameSite: 'strict', // Prevents CSRF attacks
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
  // Access Token (typically short-lived, e.g., 15m)
  // We parse the string (e.g., '15m') to a rough ms value for maxAge
  // In a robust implementation, you might want to use the exact expiration from the JWT payload
  // For simplicity, we just set standard values.
  const accessMaxAge = 15 * 60 * 1000; // 15 mins

  // Refresh Token (long-lived, e.g., 7d)
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: accessMaxAge,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: refreshMaxAge,
    path: '/api/v1/auth/refresh', // Optional: Only send to the refresh endpoint for extra security
  });
};

/**
 * Clears the authentication cookies (Logout).
 */
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/api/v1/auth/refresh',
  });
};

/**
 * @file rate-limiter.middleware.ts
 * @layer Presentation › HTTP › Middleware
 *
 * Multi-tier API Rate Limiting.
 * Protects against brute-force attacks, denial of service (DoS), credential
 * stuffing, web scraping, and expensive computational resource exhaustion.
 *
 * Implements defense-in-depth:
 * 1. Global Limiter: Protects entire API suite against flood traffic.
 * 2. Auth Limiter: High-security threshold for login, register, password-reset.
 * 3. Payment Limiter: Protection for checkout, order creation, and payment verification.
 * 4. Upload Limiter: Protection for image & file uploads to prevent storage/bandwidth abuse.
 * 5. Reports Limiter: Protection for heavy analytical database queries.
 */

import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../../core/infrastructure/config/env';
import { ApiResponse } from '../../../shared/utils/api-response.util';
import { HttpStatus } from '../../../shared/constants/http-status.constants';
import { logger } from '../../../shared/logger/logger';

interface RateLimiterConfig {
  name: string;
  windowMs: number;
  limit: number;
  message: string;
  byUser?: boolean;
}

/**
 * Factory to generate uniform, security-hardened rate limiters.
 */
export const createRateLimiter = (config: RateLimiterConfig): RateLimitRequestHandler => {
  const { name, windowMs, limit, message, byUser = false } = config;

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true, // draft-6 / draft-7 RateLimit-* headers
    legacyHeaders: false, // disable deprecated X-RateLimit-* headers
    skip: () => !env.RATE_LIMIT_ENABLED,
    keyGenerator: (req: Request) => {
      // For user-authenticated endpoints, prioritize user ID so NAT/corporate proxy users don't share limits
      if (byUser && (req as any).user?.id) {
        return `user:${(req as any).user.id}`;
      }
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    handler: (req: Request, res: Response, _next: NextFunction, options) => {
      const retryAfterSeconds = Math.ceil(windowMs / 1000);
      const minutesRemaining = Math.ceil(retryAfterSeconds / 60);

      logger.warn(
        {
          limiter: name,
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          userId: (req as any).user?.id,
          userAgent: req.headers['user-agent'],
          limit: options.limit,
          windowMs,
        },
        `[Security] Rate limit exceeded on ${name} limiter: ${req.method} ${req.originalUrl}`
      );

      return ApiResponse.error(
        res,
        message,
        HttpStatus.TOO_MANY_REQUESTS,
        [
          {
            field: 'rateLimit',
            message: `Rate limit of ${limit} requests per ${minutesRemaining} minute(s) exceeded. Please wait before trying again.`,
          },
        ]
      );
    },
  });
};

/**
 * 1. Global Limiter
 * Applied across all /api/v1 routes to guard against scraping, DDoS, and general flood traffic.
 */
export const globalLimiter = createRateLimiter({
  name: 'Global',
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests to the API. Please slow down and try again shortly.',
});

/**
 * 2. Auth Limiter
 * Applied to login, register, forgot-password, and reset-password.
 * Prevents password dictionary attacks, credential stuffing, and bot registration swarms.
 */
export const authLimiter = createRateLimiter({
  name: 'Auth',
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts. For your security, this action has been temporarily blocked.',
});

/**
 * 3. Payment & Checkout Limiter
 * Applied to payment creation, verification, and refunds.
 * Prevents card testing, bot scalping, duplicate payment race conditions, and webhook abuse.
 */
export const paymentLimiter = createRateLimiter({
  name: 'Payment',
  windowMs: env.PAYMENT_RATE_LIMIT_WINDOW_MS,
  limit: env.PAYMENT_RATE_LIMIT_MAX_REQUESTS,
  byUser: true,
  message: 'Too many payment requests processed in a short time. Please wait a moment before trying again.',
});

/**
 * 4. Upload Limiter
 * Applied to file/image upload routes.
 * Prevents denial-of-service via storage burnout, memory spiking, and Cloudinary quota exhaustion.
 */
export const uploadLimiter = createRateLimiter({
  name: 'Upload',
  windowMs: env.UPLOAD_RATE_LIMIT_WINDOW_MS,
  limit: env.UPLOAD_RATE_LIMIT_MAX_REQUESTS,
  byUser: true,
  message: 'Upload request quota exceeded. Please wait before uploading more files.',
});

/**
 * 5. Reports & Analytics Limiter
 * Applied to heavy aggregations and export endpoints.
 * Protects database CPU/memory from compute-heavy query bombardment.
 */
export const reportsLimiter = createRateLimiter({
  name: 'Reports',
  windowMs: env.REPORTS_RATE_LIMIT_WINDOW_MS,
  limit: env.REPORTS_RATE_LIMIT_MAX_REQUESTS,
  byUser: true,
  message: 'Too many analytics or report queries generated. Please wait a minute before requesting more reports.',
});

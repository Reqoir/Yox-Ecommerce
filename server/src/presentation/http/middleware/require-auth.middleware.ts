/**
 * @file require-auth.middleware.ts
 * @layer Presentation › HTTP › Middleware
 *
 * Middleware to protect routes that require authentication.
 * Extracts JWT from cookies (or Authorization header), verifies it, and attaches the payload to req.user.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@shared/utils/jwt.helper';
import { ApiError } from '@shared/utils/api-error.util';
import { ACCESS_TOKEN_COOKIE } from '@shared/utils/cookie.helper';
import { logger } from '@shared/logger/logger';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // 1. Try to get token from cookies
    if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE];
    }
    // 2. Fallback to Authorization Header (Bearer Token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please log in.');
    }

    // 3. Verify token
    try {
      const decoded = verifyAccessToken(token);

      // 4. Attach user payload to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error: any) {
      logger.warn(`Invalid JWT token: ${error.message}`);
      throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
    }
  } catch (error) {
    next(error);
  }
};

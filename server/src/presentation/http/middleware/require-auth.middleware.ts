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
import { UserModel } from '../../../modules/users/infrastructure/models/user.model';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Authorization Header (Bearer Token) takes top priority:
    // This allows isolated Admin sessions in the same browser to authenticate cleanly
    // without colliding with Customer session cookies.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fallback to cookies
    else if (req.cookies && (req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'])) {
      token = req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'];
    }
    // 3. Fallback to query parameter (for SSE streams and websockets)
    else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please log in.');
    }

    // 3. Verify token
    let decoded: any;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      logger.warn(`Invalid JWT token: ${error.message}`);
      throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
    }

    // 4. Real-time active account check in database
    // Ensures suspended or removed staff members are locked out immediately on their very next request!
    const userDoc = await UserModel.findById(decoded.sub).select('status deletedAt roleId email').lean();

    if (!userDoc || userDoc.deletedAt) {
      throw ApiError.unauthorized('Account has been removed. Access revoked.');
    }

    if (userDoc.status === 'SUSPENDED' || userDoc.status === 'INACTIVE') {
      throw ApiError.unauthorized('Your staff account has been suspended by the administrator. Access revoked.');
    }

    // 5. Attach user payload to request
    req.user = {
      id: decoded.sub,
      email: userDoc.email || decoded.email,
      role: userDoc.roleId || decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'])) {
      token = req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'];
    } else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      // Ignore invalid token in optionalAuth
    }

    next();
  } catch {
    next();
  }
};

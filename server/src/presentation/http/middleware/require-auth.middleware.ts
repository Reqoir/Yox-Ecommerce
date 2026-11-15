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
import { getRedisClient } from '../../../core/infrastructure/database/redis/client';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Authorization Header (Bearer Token) takes top priority:
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Secure HttpOnly Cookie (Primary authentication for web app and SSE withCredentials)
    else if (req.cookies && (req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'])) {
      token = req.cookies[ACCESS_TOKEN_COOKIE] || req.cookies['accessToken'];
    }
    // 3. Short-lived Single-Use SSE Ticket (For EventSource connections without exposing JWT in URLs)
    else if (req.query && typeof req.query.ticket === 'string' && req.query.ticket.trim().length > 0) {
      const ticket = req.query.ticket.trim();
      try {
        const redis = getRedisClient();
        const ticketKey = `sse_ticket:${ticket}`;
        let ticketUserId: string | null = null;
        if (typeof (redis as any).getdel === 'function') {
          ticketUserId = await (redis as any).getdel(ticketKey);
        } else {
          const lua = "local val = redis.call('GET', KEYS[1]) if val then redis.call('DEL', KEYS[1]) end return val";
          ticketUserId = (await redis.eval(lua, 1, ticketKey)) as string | null;
        }

        if (ticketUserId) {
          const userDoc = await UserModel.findById(ticketUserId)
            .select('status deletedAt roleId email tokenVersion')
            .lean();
          if (
            userDoc &&
            !userDoc.deletedAt &&
            userDoc.status !== 'SUSPENDED' &&
            userDoc.status !== 'INACTIVE'
          ) {
            req.user = {
              id: ticketUserId,
              email: userDoc.email || '',
              role: userDoc.roleId || '',
            };
            return next();
          }
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to validate SSE ticket');
      }
    }

    // SEC-HIGH-003: Raw JWT in URL query parameters is strictly forbidden
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
    const userDoc = await UserModel.findById(decoded.sub).select('status deletedAt roleId email tokenVersion').lean();

    if (!userDoc || userDoc.deletedAt) {
      throw ApiError.unauthorized('Account has been removed. Access revoked.');
    }

    if (userDoc.status === 'SUSPENDED' || userDoc.status === 'INACTIVE') {
      throw ApiError.unauthorized('Your staff account has been suspended by the administrator. Access revoked.');
    }

    // 5. Token Version Check: exact equality check prevents replay of revoked sessions
    const currentDocVersion = (userDoc as any).tokenVersion ?? 0;
    const tokenVersion = (decoded as any).tokenVersion ?? 0;
    if (tokenVersion !== currentDocVersion) {
      throw ApiError.unauthorized('Session has been revoked due to a password change or security update. Please log in again.');
    }

    // 6. Attach user payload to request
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

/**
 * @file cache.middleware.ts
 * @layer Presentation › HTTP › Middleware
 *
 * High-performance Redis caching middleware.
 * Caches HTTP GET responses in Redis RAM to achieve sub-10ms response times.
 */

import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../../core/infrastructure/database/redis/client';
import { isRedisConnected } from '../../../core/infrastructure/database/redis/connection';
import { logger } from '../../../shared/logger/logger';

/**
 * Express middleware to cache GET requests in Redis.
 *
 * @param ttlSeconds - Time To Live in seconds (default: 300 = 5 minutes)
 * @param keyPrefix - Cache key namespace prefix (e.g. 'products', 'categories')
 */
export const cacheMiddleware = (ttlSeconds = 300, keyPrefix = 'cache') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests when Redis is actively connected
    if (req.method !== 'GET' || !isRedisConnected()) {
      return next();
    }

    const redis = getRedisClient();
    const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(cached);
        return;
      }
    } catch (err: any) {
      logger.warn({ error: err.message, cacheKey }, 'Redis: Cache read failed, proceeding to database');
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept response to write successful responses to Redis
    const originalSend = res.send.bind(res);
    res.send = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        try {
          const stringPayload = typeof body === 'string' ? body : JSON.stringify(body);
          redis.set(cacheKey, stringPayload, 'EX', ttlSeconds).catch((err: any) => {
            logger.warn({ error: err.message, cacheKey }, 'Redis: Cache write failed');
          });
        } catch {
          // ignore serialization errors
        }
      }
      return originalSend(body);
    };

    next();
  };
};

/**
 * Invalidate cached keys matching a pattern (e.g. 'products:*', 'categories:*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  if (!isRedisConnected()) return;
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      logger.info({ pattern, count: keys.length }, 'Redis: Cache invalidated successfully');
    }
  } catch (err: any) {
    logger.warn({ error: err.message, pattern }, 'Redis: Failed to invalidate cache');
  }
};


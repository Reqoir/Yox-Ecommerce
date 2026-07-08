/**
 * @file redis.config.ts
 * @layer Infrastructure › Config
 *
 * Redis connection configuration for ioredis.
 */

import type { RedisOptions } from 'ioredis';

import { env } from './env';

export interface RedisConfig {
  options: RedisOptions;
}

export const redisConfig: RedisConfig = {
  options: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD ?? undefined,
    db: env.REDIS_DB,
    lazyConnect: true,         // Connect explicitly, not on instantiation
    retryStrategy(times: number): number | null {
      if (times > 5) {
        // After 5 retries, stop trying
        return null;
      }
      // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 3200ms
      return Math.min(times * 200, 3200);
    },
    reconnectOnError(err: Error): boolean {
      const targetError = 'READONLY';
      return err.message.includes(targetError);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 10_000,
  },
};

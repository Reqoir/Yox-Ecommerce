/**
 * @file client.ts
 * @layer Infrastructure › Database › Redis
 *
 * ioredis client singleton.
 * Import `redisClient` wherever you need to interact with Redis.
 */

import Redis from 'ioredis';

import { redisConfig } from '../../config/redis.config';
import { logger } from '../../../../shared/logger/logger';

let redisClient: Redis;

/**
 * Returns the Redis client singleton.
 * Creates it on first call.
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig.options);

    redisClient.on('connect', () => {
      logger.debug('Redis: connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis: client ready');
    });

    redisClient.on('error', (err: Error) => {
      logger.error({ error: err.message }, 'Redis: client error');
    });

    redisClient.on('close', () => {
      logger.warn('Redis: connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis: reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('Redis: connection ended');
    });
  }

  return redisClient;
};

export { redisClient };

/**
 * @file connection.ts
 * @layer Infrastructure › Database › Redis
 *
 * Manages explicit Redis connection lifecycle.
 * Call connectRedis() during bootstrap and disconnectRedis() on shutdown.
 */

import { getRedisClient } from './client';
import { logger } from '../../../../shared/logger/logger';

/**
 * Explicitly connect the Redis client.
 * Verifies connectivity with a PING command.
 */
export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();

  try {
    await client.connect();
    const pong = await client.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis PING did not return PONG');
    }
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed. Running without Redis.');
    // process.exit(1);
  }
};

/**
 * Gracefully disconnect the Redis client.
 */
export const disconnectRedis = async (): Promise<void> => {
  const client = getRedisClient();

  try {
    await client.quit();
    logger.info('Redis disconnected gracefully');
  } catch (error) {
    logger.error({ error }, 'Error during Redis disconnection');
  }
};

/**
 * Check if the Redis client is currently connected.
 */
export const isRedisConnected = (): boolean => {
  const client = getRedisClient();
  return client.status === 'ready';
};

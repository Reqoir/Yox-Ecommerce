/**
 * @file redis.service.ts
 * @layer Infrastructure › Services
 *
 * Redis service — wraps ioredis with typed, promise-based utility methods.
 * Provides get/set/del/expire/flush and JSON helpers.
 */

import { getRedisClient } from '../database/redis/client';
import { logger } from '../../../shared/logger/logger';

export class RedisService {
  // ── String ────────────────────────────────────────────────────────────────

  /**
   * Get the string value of a key. Returns null if the key does not exist.
   */
  async get(key: string): Promise<string | null> {
    try {
      return await getRedisClient().get(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis: GET failed');
      throw error;
    }
  }

  /**
   * Set a key to hold the string value.
   * @param ttlSeconds - Optional TTL in seconds (EX option)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds !== undefined) {
        await getRedisClient().set(key, value, 'EX', ttlSeconds);
      } else {
        await getRedisClient().set(key, value);
      }
    } catch (error) {
      logger.error({ error, key }, 'Redis: SET failed');
      throw error;
    }
  }

  /**
   * Delete one or more keys.
   */
  async del(...keys: string[]): Promise<number> {
    try {
      return await getRedisClient().del(...keys);
    } catch (error) {
      logger.error({ error, keys }, 'Redis: DEL failed');
      throw error;
    }
  }

  /**
   * Set a timeout on a key (seconds).
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await getRedisClient().expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Redis: EXPIRE failed');
      throw error;
    }
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await getRedisClient().exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Redis: EXISTS failed');
      throw error;
    }
  }

  /**
   * Get the remaining TTL of a key in seconds. Returns -1 if no TTL, -2 if key doesn't exist.
   */
  async ttl(key: string): Promise<number> {
    try {
      return await getRedisClient().ttl(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis: TTL failed');
      throw error;
    }
  }

  // ── JSON ──────────────────────────────────────────────────────────────────

  /**
   * Store a JSON-serialisable value.
   */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Retrieve and parse a JSON value. Returns null if the key does not exist.
   */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      logger.warn({ key }, 'Redis: failed to parse JSON value');
      return null;
    }
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /**
   * Delete all keys matching a pattern. Use with caution in production.
   */
  async flush(pattern: string = '*'): Promise<void> {
    try {
      if (pattern === '*') {
        await getRedisClient().flushdb();
      } else {
        const keys = await getRedisClient().keys(pattern);
        if (keys.length > 0) {
          await getRedisClient().del(...keys);
        }
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Redis: FLUSH failed');
      throw error;
    }
  }
}

// Singleton instance
export const redisService = new RedisService();

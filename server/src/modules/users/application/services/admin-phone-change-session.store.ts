/**
 * @file admin-phone-change-session.store.ts
 * @layer Application › Services
 * @description Secure session store for multi-stage administrator mobile number change.
 * Implements:
 *  - Distributed Redis storage with strict cluster safety for PM2 multi-worker deployment
 *  - Fail-closed security policy: In production, fails closed if Redis is unavailable
 *  - Atomic concurrency locks with owner-validated Lua script release
 *  - Cryptographic token replay protection
 *  - Automatic TTL expiration and attempt counters
 */

import crypto from 'crypto';
import { getRedisClient } from '../../../../core/infrastructure/database/redis/client';
import { logger } from '../../../../shared/logger/logger';
import { env } from '../../../../core/infrastructure/config/env';
import { ApiError } from '../../../../shared/utils/api-error.util';

export type AdminPhoneChangeState =
  | 'PASSWORD_CONFIRMED_CURRENT_PHONE_OTP_PENDING'
  | 'CURRENT_PHONE_VERIFIED_NEW_PHONE_PENDING'
  | 'NEW_PHONE_OTP_PENDING'
  | 'COMPLETED';

export interface AdminPhoneChangeSession {
  sessionId: string;
  adminId: string;
  adminEmail: string;
  currentPhone: string;
  newPhone?: string;
  state: AdminPhoneChangeState;
  currentPhoneVerified: boolean;
  newPhoneVerified: boolean;
  failedAttempts: number;
  lastOtpSentAt: number;
  createdAt: number;
  expiresAt: number;
}

export class AdminPhoneChangeSessionStore {
  private static instance: AdminPhoneChangeSessionStore;

  // Configuration constants
  public static readonly SESSION_TTL_SECONDS = 600; // 10 minutes total session window
  public static readonly STEP_TTL_SECONDS = 300;    // 5 minutes per step
  public static readonly MAX_FAILED_ATTEMPTS = 3;   // Lock session after 3 failed OTP attempts
  public static readonly RESEND_COOLDOWN_SECONDS = 30; // 30 seconds cooldown between OTP triggers

  // In-memory fallback structures (used in local testing when Redis is not present)
  private memorySessions = new Map<string, AdminPhoneChangeSession>();
  private memoryLocks = new Map<string, string>(); // adminId -> sessionId
  private memoryConsumedTokens = new Set<string>();
  private forceFailClosed: boolean = false;

  private constructor() {
    // Periodic cleanup for in-memory fallback
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.memorySessions.entries()) {
        if (now > session.expiresAt) {
          this.memorySessions.delete(id);
          if (this.memoryLocks.get(session.adminId) === id) {
            this.memoryLocks.delete(session.adminId);
          }
        }
      }
    }, 60000).unref();
  }

  public static getInstance(): AdminPhoneChangeSessionStore {
    if (!AdminPhoneChangeSessionStore.instance) {
      AdminPhoneChangeSessionStore.instance = new AdminPhoneChangeSessionStore();
    }
    return AdminPhoneChangeSessionStore.instance;
  }

  /**
   * Toggles strict fail-closed enforcement (used in tests to verify cluster-mode failure behavior).
   */
  public setForceFailClosed(value: boolean): void {
    this.forceFailClosed = value;
  }

  /**
   * In production, the system must fail closed if Redis is unavailable to prevent split-brain state
   * across multiple PM2 cluster instances.
   */
  public isFailClosedRequired(): boolean {
    return this.forceFailClosed || env.NODE_ENV === 'production';
  }

  /**
   * Checks if the Redis client is connected and ready.
   */
  public isRedisAvailable(): boolean {
    try {
      const client = getRedisClient();
      return Boolean(client && client.status === 'ready');
    } catch {
      return false;
    }
  }

  /**
   * Generates a cryptographically strong session ID
   */
  public generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Attempts to acquire an exclusive lock for an admin ID to prevent concurrent changes.
   * Returns true if lock acquired, false if a session is already in progress.
   */
  public async acquireLock(adminId: string, sessionId: string): Promise<boolean> {
    const lockKey = `admin:phone_change:lock:${adminId}`;
    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        const acquired = await client.set(
          lockKey,
          sessionId,
          'EX',
          AdminPhoneChangeSessionStore.SESSION_TTL_SECONDS,
          'NX'
        );
        return acquired === 'OK';
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during lock acquisition.');
        }
        logger.warn({ err: err.message }, 'Redis acquireLock failed, falling back to memory');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    // In-memory fallback (only permitted in development/test without cluster)
    const existing = this.memoryLocks.get(adminId);
    if (existing) {
      const session = this.memorySessions.get(existing);
      if (session && Date.now() >= session.expiresAt) {
        this.memorySessions.delete(existing);
        this.memoryLocks.delete(adminId);
      } else {
        return false; // Active lock held
      }
    }

    this.memoryLocks.set(adminId, sessionId);
    return true;
  }

  /**
   * Releases the exclusive lock for an admin ID.
   * If sessionId is provided, verifies that the caller owns the lock before deleting (safe lock release).
   */
  public async releaseLock(adminId: string, sessionId?: string): Promise<void> {
    const lockKey = `admin:phone_change:lock:${adminId}`;
    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        if (sessionId) {
          const lua = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          await client.eval(lua, 1, lockKey, sessionId);
        } else {
          await client.del(lockKey);
        }
        return;
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during lock release.');
        }
        logger.warn({ err: err.message }, 'Redis releaseLock failed');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    if (sessionId) {
      if (this.memoryLocks.get(adminId) === sessionId) {
        this.memoryLocks.delete(adminId);
      }
    } else {
      this.memoryLocks.delete(adminId);
    }
  }

  /**
   * Creates and persists a new session
   */
  public async createSession(session: AdminPhoneChangeSession): Promise<void> {
    const key = `admin:phone_change:session:${session.sessionId}`;
    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        await client.set(
          key,
          JSON.stringify(session),
          'EX',
          AdminPhoneChangeSessionStore.SESSION_TTL_SECONDS
        );
        return;
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during session creation.');
        }
        logger.warn({ err: err.message }, 'Redis createSession failed, falling back to memory');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    this.memorySessions.set(session.sessionId, { ...session });
  }

  /**
   * Retrieves a session by its ID. Returns null if not found or expired.
   */
  public async getSession(sessionId: string): Promise<AdminPhoneChangeSession | null> {
    const key = `admin:phone_change:session:${sessionId}`;
    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (data) {
          const session = JSON.parse(data) as AdminPhoneChangeSession;
          if (Date.now() > session.expiresAt) {
            await this.destroySession(sessionId, session.adminId);
            return null;
          }
          return session;
        }
        return null;
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during session lookup.');
        }
        logger.warn({ err: err.message }, 'Redis getSession failed, falling back to memory');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    const session = this.memorySessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.memorySessions.delete(sessionId);
      if (this.memoryLocks.get(session.adminId) === sessionId) {
        this.memoryLocks.delete(session.adminId);
      }
      return null;
    }
    return { ...session };
  }

  /**
   * Updates an existing session
   */
  public async updateSession(session: AdminPhoneChangeSession): Promise<void> {
    const key = `admin:phone_change:session:${session.sessionId}`;
    const remainingSeconds = Math.max(1, Math.ceil((session.expiresAt - Date.now()) / 1000));

    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        await client.set(key, JSON.stringify(session), 'EX', remainingSeconds);
        return;
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during session update.');
        }
        logger.warn({ err: err.message }, 'Redis updateSession failed, falling back to memory');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    this.memorySessions.set(session.sessionId, { ...session });
  }

  /**
   * Permanently destroys a session and safely releases the concurrency lock
   */
  public async destroySession(sessionId: string, adminId?: string): Promise<void> {
    const key = `admin:phone_change:session:${sessionId}`;
    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        await client.del(key);
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during session destruction.');
        }
        logger.warn({ err: err.message }, 'Redis destroySession failed');
      }
    } else if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    const session = this.memorySessions.get(sessionId);
    const resolvedAdminId = adminId || session?.adminId;

    this.memorySessions.delete(sessionId);
    if (resolvedAdminId) {
      await this.releaseLock(resolvedAdminId, sessionId);
    }
  }

  /**
   * Replay protection: Checks if a verification token has already been consumed.
   * Uses Redis SET NX with 15-minute TTL to ensure atomic cross-cluster uniqueness.
   * Returns false if token was already consumed.
   */
  public async consumeToken(token: string): Promise<boolean> {
    if (!token || !token.trim()) return false;
    const cleanToken = token.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    const tokenKey = `admin:phone_change:consumed_token:${tokenHash}`;

    if (this.isRedisAvailable()) {
      try {
        const client = getRedisClient();
        const setOk = await client.set(tokenKey, '1', 'EX', 900, 'NX'); // 15 mins replay window
        return setOk === 'OK';
      } catch (err: any) {
        if (this.isFailClosedRequired()) {
          throw ApiError.internal('Distributed session cache (Redis) error during replay check.');
        }
        logger.warn({ err: err.message }, 'Redis consumeToken failed, falling back to memory');
      }
    }

    if (this.isFailClosedRequired()) {
      throw ApiError.internal('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');
    }

    if (this.memoryConsumedTokens.has(tokenHash)) {
      return false; // Replay detected!
    }

    this.memoryConsumedTokens.add(tokenHash);
    setTimeout(() => {
      this.memoryConsumedTokens.delete(tokenHash);
    }, 900000).unref();

    return true;
  }

  /**
   * Clear all sessions and locks (Used in unit tests)
   */
  public clearAll(): void {
    this.memorySessions.clear();
    this.memoryLocks.clear();
    this.memoryConsumedTokens.clear();
    this.forceFailClosed = false;
  }
}

export const adminPhoneChangeSessionStore = AdminPhoneChangeSessionStore.getInstance();

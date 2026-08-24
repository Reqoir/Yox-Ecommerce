/**
 * @file env.ts
 * @layer Infrastructure › Config
 *
 * Single source of truth for all environment variables.
 * Validates env at startup using Zod — the server will crash fast if any
 * required variable is missing or malformed.
 *
 * Usage: import { env } from '@config/env';
 */

import { z } from 'zod';

const envSchema = z.object({
  // ── Application ────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_VERSION: z.string().default('v1'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .default('http://localhost:3000'),

  // ── MongoDB ────────────────────────────────────────────────────────────────
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().optional(),

  // ── Redis ──────────────────────────────────────────────────────────────────
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),

  // ── JWT ────────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_RESET_SECRET: z.string().min(32).default('super_secret_jwt_reset_password_key_12345'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_RESET_EXPIRES_IN: z.string().default('15m'),

  // ── Cloudinary ────────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // ── Logging ────────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('debug'),

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  // ── Bcrypt ────────────────────────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Throws a descriptive error on startup if validation fails.
 */
const parseEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, msgs]) => `  ✗ ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    throw new Error(`\n[Env Validation Failed]\n${messages}\n`);
  }

  return parsed.data;
};

export const env: Env = parseEnv();

export const isDev = (): boolean => env.NODE_ENV === 'development';
export const isProd = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

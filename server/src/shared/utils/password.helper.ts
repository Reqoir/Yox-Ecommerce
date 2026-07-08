/**
 * @file password.helper.ts
 * @layer Shared › Utils
 *
 * bcrypt-based password hashing and comparison helpers.
 * Salt rounds are configured via env (BCRYPT_SALT_ROUNDS).
 */

import bcrypt from 'bcryptjs';

import { env } from '../../core/infrastructure/config/env';

/**
 * Hash a plain-text password using bcrypt.
 * @returns The hashed password string
 */
export const hashPassword = async (plainText: string): Promise<string> => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
};

/**
 * Compare a plain-text password against a bcrypt hash.
 * @returns True if the password matches the hash
 */
export const comparePassword = async (
  plainText: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};

/**
 * Validate that a plain-text password meets minimum strength requirements.
 * This is a simple check; use Zod for full schema validation.
 */
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return (
    password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
  );
};

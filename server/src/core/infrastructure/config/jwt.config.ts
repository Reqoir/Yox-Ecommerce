/**
 * @file jwt.config.ts
 * @layer Infrastructure › Config
 *
 * JWT signing and verification configuration.
 * Centralises token expiry, secrets, and algorithm in one place.
 */

import type { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

import { env } from './env';

export interface JwtTokenConfig {
  secret: string;
  expiresIn: StringValue | number;
  signOptions: SignOptions;
}

export interface JwtConfig {
  access: JwtTokenConfig;
  refresh: JwtTokenConfig;
  reset: JwtTokenConfig;
  algorithm: NonNullable<SignOptions['algorithm']>;
}

export const jwtConfig: JwtConfig = {
  algorithm: 'HS256',

  access: {
    secret: env.JWT_ACCESS_SECRET,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
      issuer: 'yox-ecommerce',
      audience: 'yox-ecommerce-client',
    },
  },

  refresh: {
    secret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
      issuer: 'yox-ecommerce',
      audience: 'yox-ecommerce-client',
    },
  },

  reset: {
    secret: env.JWT_RESET_SECRET,
    expiresIn: env.JWT_RESET_EXPIRES_IN as StringValue,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: env.JWT_RESET_EXPIRES_IN as StringValue,
      issuer: 'yox-ecommerce',
      audience: 'yox-ecommerce-client',
    },
  },
};

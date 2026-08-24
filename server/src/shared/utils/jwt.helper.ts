/**
 * @file jwt.helper.ts
 * @layer Shared › Utils
 *
 * JWT signing and verification helpers.
 */

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { jwtConfig } from '../../core/infrastructure/config/jwt.config';

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Sign an access token.
 */
export const signAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, jwtConfig.access.secret, jwtConfig.access.signOptions);
};

/**
 * Sign a refresh token.
 */
export const signRefreshToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, jwtConfig.refresh.secret, jwtConfig.refresh.signOptions);
};

/**
 * Verify an access token and return the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, jwtConfig.access.secret, {
    issuer: jwtConfig.access.signOptions.issuer as string | undefined,
    audience: jwtConfig.access.signOptions.audience as string | undefined,
  });
  return decoded as TokenPayload;
};

/**
 * Verify a refresh token and return the decoded payload.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, jwtConfig.refresh.secret, {
    issuer: jwtConfig.refresh.signOptions.issuer as string | undefined,
    audience: jwtConfig.refresh.signOptions.audience as string | undefined,
  });
  return decoded as TokenPayload;
};

/**
 * Sign a reset password token.
 */
export const signResetToken = (payload: { sub: string }): string => {
  return jwt.sign(payload, jwtConfig.reset.secret, jwtConfig.reset.signOptions);
};

/**
 * Verify a reset password token.
 */
export const verifyResetToken = (token: string): { sub: string } => {
  const decoded = jwt.verify(token, jwtConfig.reset.secret, {
    issuer: jwtConfig.reset.signOptions.issuer as string | undefined,
    audience: jwtConfig.reset.signOptions.audience as string | undefined,
  });
  return decoded as { sub: string };
};

/**
 * Decode a token WITHOUT verifying the signature.
 */
export const decodeToken = (token: string): TokenPayload | null => {
  const decoded = jwt.decode(token);
  return decoded as TokenPayload | null;
};

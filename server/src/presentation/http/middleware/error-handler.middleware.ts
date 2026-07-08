/**
 * @file error-handler.middleware.ts
 * @layer Presentation › HTTP › Middleware
 *
 * Global Express error handler.
 * Maps all error types (DomainError, ApplicationError, ApiError, ZodError, etc.)
 * into a consistent ApiResponse error format.
 *
 * IMPORTANT: Must be registered LAST in the middleware chain.
 */

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { DomainError } from '../../../core/domain/errors/domain.error';
import { NotFoundError } from '../../../core/domain/errors/not-found.error';
import { ValidationError } from '../../../core/domain/errors/validation.error';
import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../core/application/errors/application.error';
import { ApiError } from '../../../shared/utils/api-error.util';
import { ApiResponse } from '../../../shared/utils/api-response.util';
import { HttpStatus } from '../../../shared/constants/http-status.constants';
import { formatZodErrors } from '../../../shared/utils/validation.helper';
import { logger } from '../../../shared/logger/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // ── Log the error ─────────────────────────────────────────────────────────
  logger.error(
    {
      err: { name: err.name, message: err.message, stack: err.stack },
      req: { method: req.method, url: req.originalUrl, ip: req.ip },
    },
    'Error caught by global handler',
  );

  // ── ApiError (already formatted for HTTP) ─────────────────────────────────
  if (err instanceof ApiError) {
    ApiResponse.error(res, err.message, err.statusCode, err.errors, err.stack);
    return;
  }

  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    ApiResponse.error(
      res,
      'Validation failed.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      formatZodErrors(err),
    );
    return;
  }

  // ── Domain errors → HTTP mapping ──────────────────────────────────────────
  if (err instanceof NotFoundError) {
    ApiResponse.error(res, err.message, HttpStatus.NOT_FOUND);
    return;
  }

  if (err instanceof ValidationError) {
    ApiResponse.error(res, err.message, HttpStatus.UNPROCESSABLE_ENTITY, err.details);
    return;
  }

  if (err instanceof DomainError) {
    ApiResponse.error(res, err.message, HttpStatus.BAD_REQUEST);
    return;
  }

  // ── Application errors → HTTP mapping ────────────────────────────────────
  if (err instanceof UnauthorizedError) {
    ApiResponse.error(res, err.message, HttpStatus.UNAUTHORIZED);
    return;
  }

  if (err instanceof ForbiddenError) {
    ApiResponse.error(res, err.message, HttpStatus.FORBIDDEN);
    return;
  }

  if (err instanceof ConflictError) {
    ApiResponse.error(res, err.message, HttpStatus.CONFLICT);
    return;
  }

  if (err instanceof ApplicationError) {
    ApiResponse.error(res, err.message, HttpStatus.BAD_REQUEST);
    return;
  }

  // ── Mongoose duplicate key error (11000) ──────────────────────────────────
  if ('code' in err && err['code'] === 11000) {
    ApiResponse.error(res, 'A resource with this value already exists.', HttpStatus.CONFLICT);
    return;
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.error(res, 'Invalid token. Please authenticate again.', HttpStatus.UNAUTHORIZED);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ApiResponse.error(res, 'Token has expired. Please authenticate again.', HttpStatus.UNAUTHORIZED);
    return;
  }

  // ── Unknown / unhandled errors ────────────────────────────────────────────
  ApiResponse.error(
    res,
    'An unexpected error occurred. Please try again later.',
    HttpStatus.INTERNAL_SERVER_ERROR,
    [],
    process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
  );
};

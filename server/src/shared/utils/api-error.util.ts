/**
 * @file api-error.util.ts
 * @layer Shared › Utils
 *
 * ApiError — the single error class used throughout the Presentation layer.
 * Extends the built-in Error with an HTTP status code and structured error details.
 *
 * The Global Error Handler in presentation/http/middleware converts all errors
 * (DomainError, ApplicationError, ZodError, etc.) into ApiErrors for the response.
 */

import type { ApiErrorDetail } from '../types/common.types';
import { HttpStatus } from '../constants/http-status.constants';

export class ApiError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly errors: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errors: ApiErrorDetail[] = [],
    isOperational = true,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ── Factory Methods ───────────────────────────────────────────────────────

  static badRequest(message: string, errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(message, HttpStatus.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Unauthorized. Please authenticate.'): ApiError {
    return new ApiError(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): ApiError {
    return new ApiError(message, HttpStatus.FORBIDDEN);
  }

  static notFound(message = 'The requested resource was not found.'): ApiError {
    return new ApiError(message, HttpStatus.NOT_FOUND);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, HttpStatus.CONFLICT);
  }

  static unprocessable(message: string, errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(message, HttpStatus.UNPROCESSABLE_ENTITY, errors);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(message, HttpStatus.TOO_MANY_REQUESTS);
  }

  static internal(message = 'An internal server error occurred.'): ApiError {
    return new ApiError(message, HttpStatus.INTERNAL_SERVER_ERROR, [], false);
  }
}

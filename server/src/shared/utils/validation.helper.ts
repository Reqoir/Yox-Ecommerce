/**
 * @file validation.helper.ts
 * @layer Shared › Utils
 *
 * Zod validation helpers for the Presentation layer.
 * Wraps Zod parse/safeParse with consistent error formatting.
 */

import type { Request } from 'express';
import type { ZodSchema, ZodError } from 'zod';

import type { ApiErrorDetail } from '../types/common.types';
import { ApiError } from './api-error.util';
import { HttpStatus } from '../constants/http-status.constants';

/**
 * Parse data against a Zod schema, returning the typed result on success.
 * Throws an ApiError (422) with formatted field errors on failure.
 */
export const zodParse = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = formatZodErrors(result.error);
    throw new ApiError(
      'Validation failed. Please check the request data.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      errors,
    );
  }

  return result.data;
};

/**
 * Parse and validate the request body, params, or query using a Zod schema.
 * @param source - 'body' | 'params' | 'query'
 */
export const validateRequest = <T>(
  req: Request,
  schema: ZodSchema<T>,
  source: 'body' | 'params' | 'query' = 'body',
): T => {
  return zodParse(schema, req[source]);
};

/**
 * Format Zod validation errors into a flat array of ApiErrorDetail objects.
 */
export const formatZodErrors = (error: ZodError): ApiErrorDetail[] => {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
};

/**
 * Safe version — returns null on failure instead of throwing.
 */
export const zodSafeParse = <T>(schema: ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
};

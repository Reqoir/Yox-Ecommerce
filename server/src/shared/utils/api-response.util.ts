/**
 * @file api-response.util.ts
 * @layer Shared › Utils
 *
 * ApiResponse — standardised response builder for all HTTP responses.
 * Every endpoint must use this to send responses.
 *
 * Response format:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: T,
 *   errors?: ApiErrorDetail[],
 *   meta?: Record<string, unknown>,
 *   timestamp: string
 * }
 */

import type { Response } from 'express';

import type { ApiErrorDetail, ApiErrorResponse, ApiSuccessResponse } from '../types/common.types';
import { HttpStatus } from '../constants/http-status.constants';

export class ApiResponse {
  /**
   * Send a successful response.
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode: HttpStatus = HttpStatus.OK,
    meta?: Record<string, unknown>,
  ): Response<ApiSuccessResponse<T>> {
    const body: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(body);
  }

  /**
   * Send a created (201) response.
   */
  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully',
  ): Response<ApiSuccessResponse<T>> {
    return ApiResponse.success(res, data, message, HttpStatus.CREATED);
  }

  /**
   * Send a 204 No Content response.
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send an error response.
   */
  static error(
    res: Response,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errors: ApiErrorDetail[] = [],
    stack?: string,
  ): Response<ApiErrorResponse> {
    const body: ApiErrorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(errors.length > 0 && { errors }),
      ...(process.env['NODE_ENV'] === 'development' && stack && { stack }),
    };
    return res.status(statusCode).json(body);
  }
}

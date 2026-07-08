/**
 * @file not-found.middleware.ts
 * @layer Presentation › HTTP › Middleware
 *
 * Catch-all handler for requests that don't match any route.
 * Must be registered AFTER all routes, BEFORE the error handler.
 */

import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../../../shared/utils/api-error.util';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(
    `The route '${req.method} ${req.originalUrl}' does not exist on this server.`,
  );
  next(error);
};

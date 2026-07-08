/**
 * @file express.d.ts
 * @layer Shared
 *
 * Express Request interface augmentation.
 * Extends the default Express types with project-specific properties.
 * Automatically picked up by TypeScript via tsconfig "include".
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

// Makes this a module augmentation (not a global script)
export {};

declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user payload decoded from JWT.
       * Populated by auth middleware. Undefined on unauthenticated routes.
       */
      user?: {
        id: string;
        email: string;
        role: string;
      };

      /**
       * Unique request ID for tracing / logging.
       */
      requestId?: string;

      /**
       * Timestamp when the request was received (Date.now()).
       */
      startTime?: number;
    }
  }
}

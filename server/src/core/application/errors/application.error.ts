/**
 * @file application.error.ts
 * @layer Application
 *
 * Application-layer errors. These represent failures in orchestration logic
 * (e.g., invalid state transitions, business rules enforced at the use-case level).
 *
 * Note: Contrast with DomainError (pure business invariants) and
 * ApiError (HTTP-specific errors in the Presentation layer).
 */

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', context);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', context);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized. Please authenticate.') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

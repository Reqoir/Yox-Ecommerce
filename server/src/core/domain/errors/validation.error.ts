/**
 * @file validation.error.ts
 * @layer Domain
 *
 * Thrown when a domain invariant or business rule is violated.
 * The Presentation layer maps this to HTTP 422 (Unprocessable Entity).
 */

import { DomainError } from './domain.error';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends DomainError {
  public readonly details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }

  static fromField(field: string, message: string): ValidationError {
    return new ValidationError(message, [{ field, message }]);
  }
}

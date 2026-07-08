/**
 * @file domain.error.ts
 * @layer Domain
 *
 * Base class for all domain-layer errors.
 * Domain errors represent violations of business rules or invariants.
 *
 * Rules:
 * - NO imports from Application, Infrastructure, or Presentation layers.
 * - These errors carry domain meaning; they are NOT HTTP errors.
 * - The Presentation layer is responsible for mapping DomainErrors → HTTP responses.
 */

export abstract class DomainError extends Error {
  /**
   * A machine-readable error code for programmatic handling.
   * Example: 'ENTITY_NOT_FOUND', 'INVARIANT_VIOLATED'
   */
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

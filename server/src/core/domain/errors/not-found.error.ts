/**
 * @file not-found.error.ts
 * @layer Domain
 *
 * Thrown when a domain entity cannot be found by the given criteria.
 * The Presentation layer maps this to HTTP 404.
 */

import { DomainError } from './domain.error';

export class NotFoundError extends DomainError {
  constructor(entityName: string, identifier?: string | number) {
    const message = identifier
      ? `${entityName} with identifier '${identifier}' was not found.`
      : `${entityName} was not found.`;

    super(message, 'ENTITY_NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

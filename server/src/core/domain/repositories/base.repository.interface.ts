/**
 * @file base.repository.interface.ts
 * @layer Domain
 *
 * Generic repository interface defining the contract for all repositories.
 * This is a PORT in Clean Architecture terms — defined in the Domain layer
 * and IMPLEMENTED by the Infrastructure layer.
 *
 * Rules:
 * - NO imports from Infrastructure or Presentation layers.
 * - Uses domain entities only, not Mongoose Documents.
 * - All methods return Promises; the domain doesn't know about ORMs.
 */

import type { PaginationQuery, PaginatedResult } from '@shared/types/common.types';

export interface IBaseRepository<TEntity> {
  /**
   * Find a single entity by its unique ID.
   * Returns null if not found (use application layer to throw NotFoundError).
   */
  findById(id: string): Promise<TEntity | null>;

  /**
   * Find all entities with optional pagination.
   */
  findAll(query?: PaginationQuery): Promise<PaginatedResult<TEntity>>;

  /**
   * Persist a new entity.
   */
  create(entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity>;

  /**
   * Update an existing entity by ID with a partial set of fields.
   * Returns null if the entity was not found.
   */
  update(id: string, data: Partial<TEntity>): Promise<TEntity | null>;

  /**
   * Hard-delete an entity by ID.
   * Returns true if deleted, false if not found.
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check whether an entity with the given ID exists.
   */
  exists(id: string): Promise<boolean>;
}

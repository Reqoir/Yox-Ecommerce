/**
 * @file base.repository.ts
 * @layer Infrastructure › Repositories
 *
 * Abstract generic Mongoose repository implementing IBaseRepository<TEntity>.
 * All concrete module repositories extend this class.
 */

import type { FilterQuery, Model, UpdateQuery } from 'mongoose';

import type { IBaseRepository } from '../../domain/repositories/base.repository.interface';
import type {
  PaginatedResult,
  PaginationMeta,
  PaginationQuery,
} from '../../../shared/types/common.types';

export abstract class BaseRepository<TEntity, TDocument>
  implements IBaseRepository<TEntity>
{
  constructor(protected readonly model: Model<TDocument>) {}

  /**
   * Subclasses must implement domain entity ↔ Mongoose document mapping.
   */
  protected abstract toDomain(doc: TDocument): TEntity;

  // ── IBaseRepository Implementation ────────────────────────────────────────

  async findById(id: string): Promise<TEntity | null> {
    const doc = await this.model.findById(id).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(query: PaginationQuery = {}): Promise<PaginatedResult<TEntity>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search } = query;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery: Record<string, 1 | -1> = { [sort]: sortOrder };

    const filter: FilterQuery<TDocument> = search ? this.buildSearchFilter(search) : {};

    const [docs, totalItems] = await Promise.all([
      this.model.find(filter).sort(sortQuery).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const meta: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return { data: docs.map((doc) => this.toDomain(doc)), meta };
  }

  async create(data: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TEntity> {
    const doc = await this.model.create(data);
    return this.toDomain(doc);
  }

  async update(id: string, data: Partial<TEntity>): Promise<TEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        data as unknown as UpdateQuery<TDocument>,
        { new: true, runValidators: true },
      )
      .exec();

    if (!doc) return null;
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({ _id: id } as FilterQuery<TDocument>)
      .exec();
    return count > 0;
  }

  // ── Protected Helpers ────────────────────────────────────────────────────

  protected buildSearchFilter(_search: string): FilterQuery<TDocument> {
    return {};
  }

  protected async findOne(filter: FilterQuery<TDocument>): Promise<TEntity | null> {
    const doc = await this.model.findOne(filter).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  protected async count(filter: FilterQuery<TDocument> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}

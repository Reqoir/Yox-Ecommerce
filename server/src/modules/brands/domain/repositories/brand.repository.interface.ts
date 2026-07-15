/**
 * @file brand.repository.interface.ts
 * @layer Domain › Repositories
 *
 * Defines the repository interface for Brand entities.
 */

import { IBaseRepository } from '@core/domain/repositories/base.repository.interface';
import { Brand } from '../entities/brand.entity';

export interface IBrandRepository extends IBaseRepository<Brand> {
  findBySlug(slug: string): Promise<Brand | null>;
  findByName(name: string): Promise<Brand | null>;
}

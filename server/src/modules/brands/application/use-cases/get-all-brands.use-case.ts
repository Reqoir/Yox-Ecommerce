/**
 * @file get-all-brands.use-case.ts
 * @layer Application › Use Cases
 *
 * Use case for retrieving paginated brands.
 */

import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { Brand } from '../../domain/entities/brand.entity';
import { PaginationQuery, PaginatedResult } from '@shared/types/common.types';

export class GetAllBrandsUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  public async execute(query: PaginationQuery): Promise<PaginatedResult<Brand>> {
    return this.brandRepository.findAll(query);
  }
}

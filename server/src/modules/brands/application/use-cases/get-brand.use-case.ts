/**
 * @file get-brand.use-case.ts
 * @layer Application › Use Cases
 *
 * Use case for retrieving a brand by ID.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { Brand } from '../../domain/entities/brand.entity';

export class GetBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  public async execute(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw ApiError.notFound('Brand not found.');
    }
    return brand;
  }
}

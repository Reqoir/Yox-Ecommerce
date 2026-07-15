/**
 * @file delete-brand.use-case.ts
 * @layer Application › Use Cases
 *
 * Use case for deleting a brand.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';

export class DeleteBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  public async execute(id: string): Promise<void> {
    const existingBrand = await this.brandRepository.findById(id);
    if (!existingBrand) {
      throw ApiError.notFound('Brand not found.');
    }

    const deleted = await this.brandRepository.delete(id);
    if (!deleted) {
      throw ApiError.internal('Failed to delete brand.');
    }
  }
}

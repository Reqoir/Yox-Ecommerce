/**
 * @file update-brand.use-case.ts
 * @layer Application › Use Cases
 *
 * Use case for updating a brand.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { UpdateBrandDTO } from '../dtos/brand.dto';
import { Brand } from '../../domain/entities/brand.entity';

export class UpdateBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  public async execute(id: string, data: UpdateBrandDTO): Promise<Brand> {
    const existingBrand = await this.brandRepository.findById(id);
    if (!existingBrand) {
      throw ApiError.notFound('Brand not found.');
    }

    if (data.slug && data.slug !== existingBrand.slug) {
      const slugExists = await this.brandRepository.findBySlug(data.slug);
      if (slugExists) {
        throw ApiError.conflict('A brand with this slug already exists.');
      }
    }

    const updatedBrand = await this.brandRepository.update(id, data);
    if (!updatedBrand) {
      throw ApiError.internal('Failed to update brand.');
    }

    return updatedBrand;
  }
}

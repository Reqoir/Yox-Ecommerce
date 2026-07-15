/**
 * @file create-brand.use-case.ts
 * @layer Application › Use Cases
 *
 * Use case for creating a new brand.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { CreateBrandDTO } from '../dtos/brand.dto';
import { Brand } from '../../domain/entities/brand.entity';

export class CreateBrandUseCase {
  constructor(private readonly brandRepository: IBrandRepository) {}

  public async execute(data: CreateBrandDTO): Promise<Brand> {
    // Check if brand with same slug already exists
    const existingBrand = await this.brandRepository.findBySlug(data.slug);
    if (existingBrand) {
      throw ApiError.conflict('A brand with this slug already exists.');
    }

    // Create the brand
    const newBrand = await this.brandRepository.create({
      ...data,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      logo: data.logo ?? null,
      description: data.description ?? null,
      website: data.website ?? null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
    });

    return newBrand;
  }
}

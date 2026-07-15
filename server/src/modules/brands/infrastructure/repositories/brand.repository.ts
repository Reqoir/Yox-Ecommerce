/**
 * @file brand.repository.ts
 * @layer Infrastructure › Repositories
 *
 * Mongoose implementation of the IBrandRepository.
 */

import { BaseRepository } from '@core/infrastructure/repositories/base.repository';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { Brand } from '../../domain/entities/brand.entity';
import { BrandModel, IBrandDocument } from '../models/brand.model';
import { FilterQuery } from 'mongoose';

export class BrandRepository
  extends BaseRepository<Brand, IBrandDocument>
  implements IBrandRepository
{
  constructor() {
    super(BrandModel);
  }

  protected toDomain(doc: IBrandDocument): Brand {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      logo: doc.logo,
      description: doc.description,
      website: doc.website,
      displayOrder: doc.displayOrder,
      isActive: doc.isActive,
      seoTitle: doc.seoTitle,
      seoDescription: doc.seoDescription,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  protected buildSearchFilter(search: string): FilterQuery<IBrandDocument> {
    return {
      $text: { $search: search },
    };
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return this.findOne({ slug });
  }

  async findByName(name: string): Promise<Brand | null> {
    return this.findOne({ name });
  }
}

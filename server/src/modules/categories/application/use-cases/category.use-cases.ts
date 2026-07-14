/**
 * @file category.use-cases.ts
 * @layer Application › Use Cases
 * 
 * Contains all use cases for the Categories module.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryRequestDTO, UpdateCategoryRequestDTO, CategoryResponseDTO } from '../dtos/category.dto';

// --- Mappers ---
function mapToResponseDTO(category: Category): CategoryResponseDTO {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    icon: category.icon,
    parentCategoryId: category.parentCategoryId,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// --- Commands ---

export class CreateCategoryUseCase implements IUseCase<CreateCategoryRequestDTO, CategoryResponseDTO> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: CreateCategoryRequestDTO): Promise<CategoryResponseDTO> {
    const existing = await this.categoryRepo.findBySlug(input.slug);
    if (existing) {
      throw new Error(`Category with slug ${input.slug} already exists`);
    }

    if (input.parentCategoryId) {
        const parentCategory = await this.categoryRepo.findById(input.parentCategoryId);
        if (!parentCategory) {
            throw new Error(`Parent category not found`);
        }
    }

    const category = Category.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      image: input.image,
      icon: input.icon,
      parentCategoryId: input.parentCategoryId,
      isActive: input.isActive !== undefined ? input.isActive : true,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : 0,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    });

    const savedCategory = await this.categoryRepo.save(category);
    return mapToResponseDTO(savedCategory);
  }
}

export class UpdateCategoryUseCase implements IUseCase<{ id: string; data: UpdateCategoryRequestDTO }, CategoryResponseDTO> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: { id: string; data: UpdateCategoryRequestDTO }): Promise<CategoryResponseDTO> {
    const category = await this.categoryRepo.findById(input.id);
    if (!category) throw new Error('Category not found');

    if (input.data.slug && input.data.slug !== category.slug) {
      const existing = await this.categoryRepo.findBySlug(input.data.slug);
      if (existing) throw new Error(`Category with slug ${input.data.slug} already exists`);
    }
    
    if (input.data.parentCategoryId && input.data.parentCategoryId !== category.parentCategoryId) {
      if (input.data.parentCategoryId === input.id) {
          throw new Error(`A category cannot be its own parent`);
      }
      const parentCategory = await this.categoryRepo.findById(input.data.parentCategoryId);
      if (!parentCategory) {
          throw new Error(`Parent category not found`);
      }
    }

    const updatedProps = { ...category.toJSON(), ...input.data, id: category.id, createdAt: category.createdAt, updatedAt: new Date() };
    const updatedCategory = Category.reconstitute(updatedProps);
    const savedCategory = await this.categoryRepo.save(updatedCategory);

    return mapToResponseDTO(savedCategory);
  }
}

export class DeleteCategoryUseCase implements IUseCase<string, void> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.categoryRepo.delete(id);
    if (!deleted) throw new Error('Category not found');
  }
}

// --- Queries ---

export class GetCategoryByIdUseCase implements IUseCase<string, CategoryResponseDTO> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<CategoryResponseDTO> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new Error('Category not found');
    return mapToResponseDTO(category);
  }
}

export class GetAllCategoriesUseCase implements IUseCase<any, { data: CategoryResponseDTO[]; total: number }> {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(query: any): Promise<{ data: CategoryResponseDTO[]; total: number }> {
    const result = await this.categoryRepo.findAll(query);
    return {
      data: result.data.map(c => mapToResponseDTO(c)),
      total: result.total,
    };
  }
}

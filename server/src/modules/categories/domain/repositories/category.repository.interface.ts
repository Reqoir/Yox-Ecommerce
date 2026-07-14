/**
 * @file category.repository.interface.ts
 * @layer Domain
 * 
 * Defines the contract for the Category repository.
 */

import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(query: any): Promise<{ data: Category[]; total: number }>;
  delete(id: string): Promise<boolean>;
}

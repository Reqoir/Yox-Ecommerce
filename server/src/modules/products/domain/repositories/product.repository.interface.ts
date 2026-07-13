/**
 * @file product.repository.interface.ts
 * @layer Domain
 * 
 * Defines the contract for the Product repository.
 */

import { Product } from '../entities/product.entity';

export interface IProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findAll(query: any): Promise<{ data: Product[]; total: number }>;
  delete(id: string): Promise<boolean>;
  findFeatured(limit: number): Promise<Product[]>;
  findLatest(limit: number): Promise<Product[]>;
  findBestSelling(limit: number): Promise<Product[]>;
}

/**
 * @file product-variant.repository.interface.ts
 * @layer Domain
 * 
 * Defines the contract for the ProductVariant repository.
 */

import { ProductVariant } from '../entities/product-variant.entity';

export interface IProductVariantRepository {
  save(variant: ProductVariant): Promise<ProductVariant>;
  saveMany(variants: ProductVariant[]): Promise<ProductVariant[]>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  findById(id: string): Promise<ProductVariant | null>;
  findByBarcode(barcode: string): Promise<ProductVariant | null>;
  findAll(query?: any): Promise<{ data: ProductVariant[]; total: number }>;
  delete(id: string): Promise<boolean>;
  deleteByProductId(productId: string): Promise<boolean>;
}

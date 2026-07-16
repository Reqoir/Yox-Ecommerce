/**
 * @file inventory.repository.interface.ts
 * @layer Domain
 */

import { Inventory } from '../entities/inventory.entity';

export interface IInventoryRepository {
  save(inventory: Inventory): Promise<Inventory>;
  findById(id: string): Promise<Inventory | null>;
  findByVariantId(variantId: string): Promise<Inventory | null>;
  findAll(query: any): Promise<{ data: Inventory[]; total: number }>;
}

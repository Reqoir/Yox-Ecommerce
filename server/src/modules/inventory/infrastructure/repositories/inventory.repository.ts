/**
 * @file inventory.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { Inventory } from '../../domain/entities/inventory.entity';
import { InventoryModel, IInventoryDocument } from '../models/inventory.model';
import { Types } from 'mongoose';

export class InventoryRepository implements IInventoryRepository {
  
  private mapToDomain(doc: IInventoryDocument): Inventory {
    const data = doc.toObject();
    return Inventory.reconstitute({
      id: data.id,
      variantId: data.variantId,
      availableStock: data.availableStock,
      reservedStock: data.reservedStock,
      damagedStock: data.damagedStock,
      warehouseLocation: data.warehouseLocation,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const data = inventory.toJSON();
    const { id, ...rest } = data;
    
    if (id) {
      const updated = await InventoryModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Inventory not found');
      return this.mapToDomain(updated);
    } else {
      const created = new InventoryModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Inventory | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await InventoryModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByVariantId(variantId: string): Promise<Inventory | null> {
    const doc = await InventoryModel.findOne({ variantId }).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(query: any): Promise<{ data: Inventory[]; total: number }> {
    const filter: any = {};
    if (query.warehouseLocation) filter.warehouseLocation = query.warehouseLocation;

    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      InventoryModel.find(filter).skip(skip).limit(limit).exec(),
      InventoryModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }
}

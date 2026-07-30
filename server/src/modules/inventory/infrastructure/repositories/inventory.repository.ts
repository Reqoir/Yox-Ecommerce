/**
 * @file inventory.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { Inventory } from '../../domain/entities/inventory.entity';
import { InventoryModel, IInventoryDocument } from '../models/inventory.model';
import { ProductVariantModel } from '../../../products/infrastructure/models/product-variant.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { Types } from 'mongoose';

export class InventoryRepository implements IInventoryRepository {

  /**
   * Auto-sync helper: Ensures that every existing ProductVariant has an Inventory record.
   * If a ProductVariant doesn't have an Inventory document yet, one is created automatically.
   */
  private async ensureInventoryForAllVariants(): Promise<void> {
    try {
      const allVariants = await ProductVariantModel.find().lean().exec();
      if (!allVariants || allVariants.length === 0) return;

      const variantIdStrings = allVariants.map((v) => v._id.toString());
      const existingInventories = await InventoryModel.find({
        variantId: { $in: variantIdStrings },
      }).lean().exec();

      const existingVariantIds = new Set(existingInventories.map((i) => i.variantId));
      const missingVariants = allVariants.filter((v) => !existingVariantIds.has(v._id.toString()));

      if (missingVariants.length > 0) {
        const docsToCreate = missingVariants.map((v) => ({
          variantId: v._id.toString(),
          availableStock: typeof v.stock === 'number' ? v.stock : 0,
          reservedStock: 0,
          damagedStock: 0,
          warehouseLocation: null,
          lowStockThreshold: typeof v.lowStockThreshold === 'number' ? v.lowStockThreshold : 10,
        }));
        await InventoryModel.insertMany(docsToCreate);
      }
    } catch (error) {
      console.error('Error auto-syncing inventory records for variants:', error);
    }
  }

  /**
   * Helper: Populates product and variant details (name, sku, image, title, color, size)
   * for a batch of Inventory documents.
   */
  private async populateProductDetails(docs: IInventoryDocument[]): Promise<Inventory[]> {
    if (!docs || docs.length === 0) return [];

    const variantIds = docs.map((d) => d.variantId).filter(Boolean);
    const validObjectIds = variantIds.filter((id) => Types.ObjectId.isValid(id));

    const variants = await ProductVariantModel.find({ _id: { $in: validObjectIds } }).lean().exec();
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    const productIds = Array.from(
      new Set(variants.map((v) => v.productId).filter((id) => id && Types.ObjectId.isValid(id)))
    );

    const products = await ProductModel.find({ _id: { $in: productIds } }).lean().exec();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    return docs.map((doc) => {
      const data = doc.toObject();
      const variant = variantMap.get(data.variantId);
      const product = variant?.productId ? productMap.get(variant.productId) : null;

      const productImage = variant?.images?.[0] || product?.thumbnail || null;

      return Inventory.reconstitute({
        id: data.id,
        variantId: data.variantId,
        availableStock: data.availableStock,
        reservedStock: data.reservedStock,
        damagedStock: data.damagedStock,
        warehouseLocation: data.warehouseLocation,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        productName: product?.name || null,
        productImage,
        sku: variant?.sku || null,
        variantTitle: variant?.title || null,
        color: variant?.color || null,
        size: variant?.size || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const data = inventory.toJSON();
    const { id, ...rest } = data;
    
    let doc: IInventoryDocument | null = null;
    if (id) {
      doc = await InventoryModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!doc) throw new Error('Inventory not found');
    } else {
      const created = new InventoryModel(rest);
      doc = await created.save();
    }

    // Keep ProductVariant stock synced in MongoDB
    if (inventory.variantId && Types.ObjectId.isValid(inventory.variantId)) {
      await ProductVariantModel.findByIdAndUpdate(inventory.variantId, {
        stock: inventory.availableStock,
      }).exec();
    }

    const populated = await this.populateProductDetails([doc]);
    return populated[0];
  }

  async findById(id: string): Promise<Inventory | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await InventoryModel.findById(id).exec();
    if (!doc) return null;
    const populated = await this.populateProductDetails([doc]);
    return populated[0] || null;
  }

  async findByVariantId(variantId: string): Promise<Inventory | null> {
    await this.ensureInventoryForAllVariants();
    const doc = await InventoryModel.findOne({ variantId }).exec();
    if (!doc) return null;
    const populated = await this.populateProductDetails([doc]);
    return populated[0] || null;
  }

  async findAll(query: any): Promise<{ data: Inventory[]; total: number }> {
    await this.ensureInventoryForAllVariants();

    const filter: any = {};
    if (query.warehouseLocation) filter.warehouseLocation = query.warehouseLocation;

    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      InventoryModel.find(filter).skip(skip).limit(limit).exec(),
      InventoryModel.countDocuments(filter).exec(),
    ]);

    const data = await this.populateProductDetails(docs);

    return {
      data,
      total,
    };
  }

  /**
   * Finds all inventory records where availableStock <= lowStockThreshold.
   * Uses $expr to compare two document fields directly — leverages the compound index.
   */
  async findLowStock(query: any): Promise<{ data: Inventory[]; total: number }> {
    await this.ensureInventoryForAllVariants();

    const filter: any = { $expr: { $lte: ['$availableStock', '$lowStockThreshold'] } };

    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      InventoryModel.find(filter).sort({ availableStock: 1 }).skip(skip).limit(limit).exec(),
      InventoryModel.countDocuments(filter).exec(),
    ]);

    const data = await this.populateProductDetails(docs);

    return {
      data,
      total,
    };
  }
}

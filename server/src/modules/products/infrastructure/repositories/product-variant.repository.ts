/**
 * @file product-variant.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the ProductVariantRepository using Mongoose.
 */

import { IProductVariantRepository } from '../../domain/repositories/product-variant.repository.interface';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { ProductVariantModel, IProductVariantDocument } from '../models/product-variant.model';
import { Types } from 'mongoose';

export class ProductVariantRepository implements IProductVariantRepository {
  
  private mapToDomain(doc: IProductVariantDocument): ProductVariant {
    const data = doc.toObject();
    return ProductVariant.reconstitute({
      id: data.id,
      productId: data.productId,
      sku: data.sku,
      title: data.title,
      color: data.color,
      price: data.price,
      comparePrice: data.comparePrice,
      costPrice: data.costPrice,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      weight: data.weight,
      barcode: data.barcode,
      images: data.images,
      isDefault: data.isDefault,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(variant: ProductVariant): Promise<ProductVariant> {
    const data = variant.toJSON();
    const { id, ...rest } = data;
    
    if (id) {
      const updated = await ProductVariantModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('ProductVariant not found');
      return this.mapToDomain(updated);
    } else {
      const created = new ProductVariantModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async saveMany(variants: ProductVariant[]): Promise<ProductVariant[]> {
    const operations = variants.map(variant => {
      const data = variant.toJSON();
      const { id, ...rest } = data;
      if (id) {
        return { updateOne: { filter: { _id: id }, update: { $set: rest }, upsert: true } };
      } else {
        return { insertOne: { document: rest } };
      }
    });
    
    if (operations.length > 0) {
      await ProductVariantModel.bulkWrite(operations as any);
    }
    
    // Simplification: We fetch back by productId assuming they share it for this operation context.
    // In a robust scenario, we'd map bulkWrite results.
    if (variants.length > 0) {
      const productId = variants[0].productId;
      return this.findByProductId(productId);
    }
    return [];
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const docs = await ProductVariantModel.find({ productId }).exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findById(id: string): Promise<ProductVariant | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ProductVariantModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await ProductVariantModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async deleteByProductId(productId: string): Promise<boolean> {
    const result = await ProductVariantModel.deleteMany({ productId }).exec();
    return result.acknowledged;
  }
}

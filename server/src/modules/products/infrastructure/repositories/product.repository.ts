/**
 * @file product.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the ProductRepository using Mongoose.
 */

import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductModel, IProductDocument } from '../models/product.model';
import { Types } from 'mongoose';

export class ProductRepository implements IProductRepository {
  
  private mapToDomain(doc: IProductDocument): Product {
    const data = doc.toObject();
    return Product.reconstitute({
      id: data.id,
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      brandId: data.brandId,
      shortDescription: data.shortDescription,
      description: data.description,
      thumbnail: data.thumbnail,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      salesCount: data.salesCount,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(product: Product): Promise<Product> {
    const data = product.toJSON();
    const { id, ...rest } = data;
    
    if (id) {
      const updated = await ProductModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Product not found');
      return this.mapToDomain(updated);
    } else {
      const created = new ProductModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ProductModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ slug }).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(query: any): Promise<{ data: Product[]; total: number }> {
    const filter: any = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.brandId) filter.brandId = query.brandId;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ProductModel.find(filter).skip(skip).limit(limit).exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await ProductModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async findFeatured(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findLatest(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findBestSelling(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }
}

/**
 * @file category.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the CategoryRepository using Mongoose.
 */

import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CategoryModel, ICategoryDocument } from '../models/category.model';
import { Types } from 'mongoose';

export class CategoryRepository implements ICategoryRepository {
  
  private mapToDomain(doc: ICategoryDocument): Category {
    const data = doc.toObject();
    return Category.reconstitute({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      icon: data.icon,
      parentCategoryId: data.parentCategoryId,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(category: Category): Promise<Category> {
    const data = category.toJSON();
    const { id, ...rest } = data;
    
    if (id) {
      const updated = await CategoryModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Category not found');
      return this.mapToDomain(updated);
    } else {
      const created = new CategoryModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Category | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CategoryModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({ slug }).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(query: any): Promise<{ data: Category[]; total: number }> {
    const filter: any = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.parentCategoryId !== undefined) filter.parentCategoryId = query.parentCategoryId;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      CategoryModel.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      CategoryModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await CategoryModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

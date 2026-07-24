/**
 * @file cart.repository.ts
 * @layer Infrastructure
 * 
 * Mongoose implementation of the Cart repository.
 */

import { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { CartModel, ICartDocument } from '../models/cart.model';
import { PaginationQuery, PaginatedResult } from '../../../../shared/types/common.types';

export class CartRepository implements ICartRepository {
  
  private mapToDomain(doc: ICartDocument): Cart {
    return Cart.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      items: doc.items.map(item => ({
        variantId: item.variantId.toString(),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      totalItems: doc.totalItems,
      totalAmount: doc.totalAmount,
      couponId: doc.couponId?.toString() ?? null,
      discountAmount: doc.discountAmount ?? null,
      finalAmount: doc.finalAmount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({ userId }).exec();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(cart: Cart): Promise<Cart> {
    const data = cart.toJSON();
    
    // We omit 'id' for new documents, or use it for upsert
    const updateData = {
      userId: data.userId,
      items: data.items,
      totalItems: data.totalItems,
      totalAmount: data.totalAmount,
      couponId: data.couponId || null,
      discountAmount: data.discountAmount || null,
      finalAmount: data.finalAmount,
      updatedAt: data.updatedAt,
    };

    let doc;
    if (data.id) {
      doc = await CartModel.findByIdAndUpdate(data.id, updateData, { new: true }).exec();
    }
    
    if (!doc) {
      // If no ID or not found by ID (maybe just created in domain), fallback to upsert by userId
      doc = await CartModel.findOneAndUpdate(
        { userId: data.userId },
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).exec();
    }

    return this.mapToDomain(doc);
  }

  async findById(id: string): Promise<Cart | null> {
    const doc = await CartModel.findById(id).exec();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findAll(query?: PaginationQuery): Promise<PaginatedResult<Cart>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      CartModel.find().skip(skip).limit(limit).exec(),
      CartModel.countDocuments().exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      }
    };
  }

  async create(_cartData: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cart> {
    throw new Error('Use save() method for Cart entity to enforce domain logic.');
  }

  async update(_id: string, _data: Partial<Cart>): Promise<Cart | null> {
    throw new Error('Use save() method for Cart entity to enforce domain logic.');
  }

  async delete(id: string): Promise<boolean> {
    const result = await CartModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await CartModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }
}

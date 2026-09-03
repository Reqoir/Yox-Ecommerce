/**
 * @file offer.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements IOfferRepository using Mongoose.
 */

import { IOfferRepository } from '../../domain/repositories/offer.repository.interface';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferModel, IOfferDocument } from '../models/offer.model';
import { Types } from 'mongoose';

export class OfferRepository implements IOfferRepository {
  private mapToDomain(doc: IOfferDocument): Offer {
    const data = doc.toObject();
    return Offer.reconstitute({
      id: data.id,
      title: data.title,
      description: data.description,
      code: data.code,
      offerType: data.offerType,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue,
      maxDiscountAmount: data.maxDiscountAmount,
      applicableProductIds: data.applicableProductIds || [],
      applicableCategoryIds: data.applicableCategoryIds || [],
      applicableBrandIds: data.applicableBrandIds || [],
      isLimitedTime: data.isLimitedTime,
      startDate: data.startDate,
      endDate: data.endDate,
      banner: data.banner || null,
      badgeText: data.badgeText,
      badgeColor: data.badgeColor,
      priority: data.priority,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(offer: Offer): Promise<Offer> {
    const data = offer.toJSON();
    const { id, ...rest } = data;

    if (id && Types.ObjectId.isValid(id)) {
      const updated = await OfferModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Offer not found');
      return this.mapToDomain(updated);
    } else {
      const created = new OfferModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Offer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OfferModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByCode(code: string): Promise<Offer | null> {
    if (!code) return null;
    const doc = await OfferModel.findOne({ code: code.trim().toUpperCase() }).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(query: Record<string, any> = {}): Promise<{ data: Offer[]; total: number }> {
    const filter: any = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }
    if (query.offerType) {
      filter.offerType = query.offerType;
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const limit = parseInt(query.limit) || 50;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      OfferModel.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      OfferModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((d) => this.mapToDomain(d)),
      total,
    };
  }

  async findActive(now: Date = new Date()): Promise<Offer[]> {
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const docs = await OfferModel.find(filter).sort({ priority: -1, createdAt: -1 }).exec();
    return docs.map((d) => this.mapToDomain(d));
  }

  async findBanners(now: Date = new Date()): Promise<Offer[]> {
    const filter = {
      isActive: true,
      'banner.showOnHome': true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const docs = await OfferModel.find(filter).sort({ priority: -1, createdAt: -1 }).exec();
    return docs.map((d) => this.mapToDomain(d));
  }

  async findOffersForProduct(
    productId: string,
    categoryId?: string | null,
    brandId?: string | null,
    now: Date = new Date()
  ): Promise<Offer[]> {
    const orConditions: any[] = [
      { applicableProductIds: productId },
    ];

    if (categoryId) {
      orConditions.push({ applicableCategoryIds: categoryId });
    }
    if (brandId) {
      orConditions.push({ applicableBrandIds: brandId });
    }

    const filter = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
        { $or: orConditions },
      ],
    };

    const docs = await OfferModel.find(filter).sort({ priority: -1, discountValue: -1 }).exec();
    return docs.map((d) => this.mapToDomain(d));
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await OfferModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

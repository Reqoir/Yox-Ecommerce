/**
 * @file offer.use-cases.ts
 * @layer Application › Use Cases
 * 
 * Contains all business use cases for the Offers module.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IOfferRepository } from '../../domain/repositories/offer.repository.interface';
import { Offer } from '../../domain/entities/offer.entity';
import {
  CreateOfferRequestDTO,
  UpdateOfferRequestDTO,
  OfferResponseDTO,
  ProductBestOfferDTO,
} from '../dtos/offer.dto';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

// --- Helper Mappers ---
function mapToResponseDTO(offer: Offer, now: Date = new Date()): OfferResponseDTO {
  const json = offer.toJSON();
  const endDate = json.endDate ? new Date(json.endDate) : null;
  const remainingSeconds = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000)) : null;

  return {
    ...json,
    id: offer.id,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    isCurrentlyValid: offer.isCurrentlyValid(now),
    remainingSeconds,
  };
}

export class CreateOfferUseCase implements IUseCase<CreateOfferRequestDTO, OfferResponseDTO> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(input: CreateOfferRequestDTO): Promise<OfferResponseDTO> {
    if (input.code) {
      const existing = await this.offerRepo.findByCode(input.code);
      if (existing) {
        throw new Error(`An offer with code '${input.code}' already exists.`);
      }
    }

    const offer = Offer.create({
      title: input.title,
      description: input.description,
      code: input.code ? input.code.trim().toUpperCase() : null,
      offerType: input.offerType,
      discountType: input.discountType,
      discountValue: Number(input.discountValue),
      minOrderValue: input.minOrderValue !== undefined && input.minOrderValue !== null ? Number(input.minOrderValue) : null,
      maxDiscountAmount: input.maxDiscountAmount !== undefined && input.maxDiscountAmount !== null ? Number(input.maxDiscountAmount) : null,
      applicableProductIds: input.applicableProductIds || [],
      applicableCategoryIds: input.applicableCategoryIds || [],
      applicableBrandIds: input.applicableBrandIds || [],
      isLimitedTime: Boolean(input.isLimitedTime || input.offerType === 'LIMITED_TIME'),
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      banner: input.banner || null,
      badgeText: input.badgeText || null,
      badgeColor: input.badgeColor || null,
      priority: Number(input.priority || 0),
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
    });

    const saved = await this.offerRepo.save(offer);
    return mapToResponseDTO(saved);
  }
}

export class UpdateOfferUseCase implements IUseCase<{ id: string; data: UpdateOfferRequestDTO }, OfferResponseDTO> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(input: { id: string; data: UpdateOfferRequestDTO }): Promise<OfferResponseDTO> {
    const existing = await this.offerRepo.findById(input.id);
    if (!existing) throw new NotFoundError(`Offer not found: ${input.id}`);

    if (input.data.code && input.data.code !== existing.code) {
      const duplicate = await this.offerRepo.findByCode(input.data.code);
      if (duplicate && duplicate.id !== existing.id) {
        throw new Error(`An offer with code '${input.data.code}' already exists.`);
      }
    }

    const currentProps = existing.toJSON();
    const updatedOffer = Offer.reconstitute({
      ...currentProps,
      ...input.data,
      id: existing.id,
      code: input.data.code !== undefined ? (input.data.code ? input.data.code.trim().toUpperCase() : null) : currentProps.code,
      discountValue: input.data.discountValue !== undefined ? Number(input.data.discountValue) : currentProps.discountValue,
      priority: input.data.priority !== undefined ? Number(input.data.priority) : currentProps.priority,
      startDate: input.data.startDate !== undefined ? (input.data.startDate ? new Date(input.data.startDate) : null) : currentProps.startDate,
      endDate: input.data.endDate !== undefined ? (input.data.endDate ? new Date(input.data.endDate) : null) : currentProps.endDate,
      updatedAt: new Date(),
    });

    const saved = await this.offerRepo.save(updatedOffer);
    return mapToResponseDTO(saved);
  }
}

export class DeleteOfferUseCase implements IUseCase<string, boolean> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(id: string): Promise<boolean> {
    const deleted = await this.offerRepo.delete(id);
    if (!deleted) throw new NotFoundError(`Offer not found: ${id}`);
    return true;
  }
}

export class GetOfferByIdUseCase implements IUseCase<string, OfferResponseDTO> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(id: string): Promise<OfferResponseDTO> {
    const offer = await this.offerRepo.findById(id);
    if (!offer) throw new NotFoundError(`Offer not found: ${id}`);
    return mapToResponseDTO(offer);
  }
}

export class GetAllOffersUseCase implements IUseCase<Record<string, any>, { data: OfferResponseDTO[]; total: number }> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(query: Record<string, any> = {}): Promise<{ data: OfferResponseDTO[]; total: number }> {
    const result = await this.offerRepo.findAll(query);
    return {
      data: result.data.map((o) => mapToResponseDTO(o)),
      total: result.total,
    };
  }
}

export class GetActiveOffersUseCase implements IUseCase<void, OfferResponseDTO[]> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(): Promise<OfferResponseDTO[]> {
    const offers = await this.offerRepo.findActive(new Date());
    return offers.map((o) => mapToResponseDTO(o));
  }
}

export class GetActiveBannersUseCase implements IUseCase<void, OfferResponseDTO[]> {
  constructor(private readonly offerRepo: IOfferRepository) {}

  async execute(): Promise<OfferResponseDTO[]> {
    const offers = await this.offerRepo.findBanners(new Date());
    return offers.map((o) => mapToResponseDTO(o));
  }
}

export class GetBestOfferForProductUseCase implements IUseCase<string, ProductBestOfferDTO> {
  constructor(
    private readonly offerRepo: IOfferRepository,
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(productIdOrSlug: string): Promise<ProductBestOfferDTO> {
    let product = await this.productRepo.findById(productIdOrSlug);
    if (!product) {
      product = await this.productRepo.findBySlug(productIdOrSlug);
    }
    if (!product) {
      throw new NotFoundError(`Product not found: ${productIdOrSlug}`);
    }

    const variants = await this.variantRepo.findByProductId(product.id);
    const validPrices = variants.map((v) => v.price).filter((p) => typeof p === 'number' && p > 0);
    const basePrice = validPrices.length > 0 ? Math.min(...validPrices) : 999;
    const validComparePrices = variants.map((v) => v.comparePrice).filter((cp): cp is number => typeof cp === 'number' && cp > 0);
    const comparePrice = validComparePrices.length > 0 ? Math.max(...validComparePrices) : null;

    const now = new Date();
    const applicableOffers = await this.offerRepo.findOffersForProduct(
      product.id,
      product.categoryId,
      product.brandId,
      now
    );

    let maxDiscountAmount = 0;
    let bestOffer: Offer | null = null;

    applicableOffers.forEach((offer) => {
      let discount = 0;
      if (offer.discountType === 'PERCENTAGE') {
        discount = (basePrice * offer.discountValue) / 100;
        if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
          discount = offer.maxDiscountAmount;
        }
      } else {
        discount = offer.discountValue;
      }

      // Discount cannot exceed base price
      discount = Math.min(discount, basePrice);

      if (discount > maxDiscountAmount) {
        maxDiscountAmount = discount;
        bestOffer = offer;
      }
    });

    const discountedPrice = Math.max(0, Math.round(basePrice - maxDiscountAmount));
    
    // When a product has compare amount cross that amount!
    // If not compare amount, then only cross the price amount!
    const strikePrice = comparePrice && comparePrice > discountedPrice ? comparePrice : basePrice;
    const discountPercentage = strikePrice > discountedPrice
      ? Math.round(((strikePrice - discountedPrice) / strikePrice) * 100)
      : (basePrice > 0 ? Math.round((maxDiscountAmount / basePrice) * 100) : 0);

    return {
      productId: product.id,
      originalPrice: strikePrice,
      discountedPrice,
      discountAmount: Math.round(strikePrice - discountedPrice),
      discountPercentage,
      bestOffer: bestOffer ? mapToResponseDTO(bestOffer, now) : null,
      allApplicableOffers: applicableOffers.map((o) => mapToResponseDTO(o, now)),
    };
  }
}

export interface OfferProductItemDTO {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage: number;
  inStock: boolean;
}

export interface OfferWithProductsDTO {
  offer: OfferResponseDTO;
  products: OfferProductItemDTO[];
}

export class GetOfferWithProductsUseCase implements IUseCase<string, OfferWithProductsDTO> {
  constructor(
    private readonly offerRepo: IOfferRepository,
    private readonly productVariantRepo: IProductVariantRepository
  ) {}

  async execute(offerId: string): Promise<OfferWithProductsDTO> {
    const offer = await this.offerRepo.findById(offerId);
    if (!offer) throw new NotFoundError(`Offer not found: ${offerId}`);

    const queryConditions: any[] = [];
    if (offer.applicableProductIds && offer.applicableProductIds.length > 0) {
      queryConditions.push({ _id: { $in: offer.applicableProductIds } });
    }
    if (offer.applicableCategoryIds && offer.applicableCategoryIds.length > 0) {
      queryConditions.push({ categoryId: { $in: offer.applicableCategoryIds } });
    }
    if (offer.applicableBrandIds && offer.applicableBrandIds.length > 0) {
      queryConditions.push({ brandId: { $in: offer.applicableBrandIds } });
    }

    const filter: any = { isActive: true };
    if (queryConditions.length > 0) {
      filter.$or = queryConditions;
    }

    const products = await ProductModel.find(filter).lean().exec();

    const productItems: OfferProductItemDTO[] = await Promise.all(
      products.map(async (p: any) => {
        const prodId = p._id.toString();
        const variants = await this.productVariantRepo.findByProductId(prodId);
        const validPrices = variants.map((v) => v.price).filter((pr) => typeof pr === 'number' && pr > 0);
        const basePrice = validPrices.length > 0 ? Math.min(...validPrices) : 999;
        const validComparePrices = variants.map((v) => v.comparePrice).filter((cp): cp is number => typeof cp === 'number' && cp > 0);
        const comparePrice = validComparePrices.length > 0 ? Math.max(...validComparePrices) : null;

        let discount = 0;
        if (offer.discountType === 'PERCENTAGE') {
          discount = (basePrice * offer.discountValue) / 100;
          if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
            discount = offer.maxDiscountAmount;
          }
        } else {
          discount = offer.discountValue;
        }
        discount = Math.min(discount, basePrice);
        const discountedPrice = Math.max(0, Math.round(basePrice - discount));

        // When a product has compare amount cross that amount!
        // If not compare amount, then only cross the price amount!
        const originalPrice = comparePrice && comparePrice > discountedPrice ? comparePrice : basePrice;
        const discountPercentage = originalPrice > discountedPrice 
          ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) 
          : (basePrice > 0 ? Math.round((discount / basePrice) * 100) : 0);

        return {
          id: prodId,
          name: p.name,
          slug: p.slug,
          thumbnail: p.thumbnail || null,
          categoryId: p.categoryId,
          brandId: p.brandId,
          originalPrice,
          discountedPrice,
          discountAmount: Math.round(originalPrice - discountedPrice),
          discountPercentage,
          inStock: variants.some((v) => (v.stock || 0) > 0),
        };
      })
    );

    return {
      offer: mapToResponseDTO(offer),
      products: productItems,
    };
  }
}

/**
 * @file offer.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Offer } from '../entities/offer.entity';

export interface IOfferRepository {
  save(offer: Offer): Promise<Offer>;
  findById(id: string): Promise<Offer | null>;
  findByCode(code: string): Promise<Offer | null>;
  findAll(query?: Record<string, any>): Promise<{ data: Offer[]; total: number }>;
  findActive(now?: Date): Promise<Offer[]>;
  findBanners(now?: Date): Promise<Offer[]>;
  findOffersForProduct(productId: string, categoryId?: string | null, brandId?: string | null, now?: Date): Promise<Offer[]>;
  delete(id: string): Promise<boolean>;
}

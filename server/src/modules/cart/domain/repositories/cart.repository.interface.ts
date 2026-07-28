/**
 * @file cart.repository.interface.ts
 * @layer Domain
 * 
 * Defines the contract for the Cart repository.
 */

import { IBaseRepository } from '../../../../core/domain/repositories/base.repository.interface';
import { Cart } from '../entities/cart.entity';

export interface ICartRepository extends IBaseRepository<Cart> {
  findByUserId(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
}

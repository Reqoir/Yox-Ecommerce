/**
 * @file address.repository.interface.ts
 * @layer Domain › Repositories
 */

import { IBaseRepository } from '@core/domain/repositories/base.repository.interface';
import { Address } from '../entities/address.entity';

export interface IAddressRepository extends IBaseRepository<Address> {
  findByUserId(userId: string): Promise<Address[]>;
  findDefaultByUserId(userId: string): Promise<Address | null>;
  unsetDefaultForUser(userId: string): Promise<void>;
}

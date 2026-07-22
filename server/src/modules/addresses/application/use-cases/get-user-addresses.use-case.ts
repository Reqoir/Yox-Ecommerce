/**
 * @file get-user-addresses.use-case.ts
 * @layer Application › Use Cases
 */

import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';

export class GetUserAddressesUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(userId: string): Promise<Address[]> {
    return this.addressRepository.findByUserId(userId);
  }
}

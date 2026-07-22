/**
 * @file set-default-address.use-case.ts
 * @layer Application › Use Cases
 */

import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';
import { ApiError } from '@shared/utils/api-error.util';

export class SetDefaultAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findById(addressId);
    
    if (!address) {
      throw ApiError.notFound('Address not found');
    }

    if (address.userId !== userId) {
      throw ApiError.forbidden('You can only update your own addresses');
    }

    if (address.isDefault) {
      return address;
    }

    await this.addressRepository.unsetDefaultForUser(userId);
    
    const updatedAddress = await this.addressRepository.update(addressId, { isDefault: true });
    
    if (!updatedAddress) {
      throw ApiError.internal('Failed to set default address');
    }

    return updatedAddress;
  }
}

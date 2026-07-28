/**
 * @file delete-address.use-case.ts
 * @layer Application › Use Cases
 */

import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';

export class DeleteAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    
    if (!address) {
      throw ApiError.notFound('Address not found');
    }

    if (address.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own addresses');
    }

    await this.addressRepository.delete(addressId);

    // If it was the default address, we might want to make another address the default
    if (address.isDefault) {
      const remainingAddresses = await this.addressRepository.findByUserId(userId);
      if (remainingAddresses.length > 0) {
        await this.addressRepository.update(remainingAddresses[0].id, { isDefault: true });
      }
    }
  }
}

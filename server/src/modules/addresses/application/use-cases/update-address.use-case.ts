/**
 * @file update-address.use-case.ts
 * @layer Application › Use Cases
 */

import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';
import { ApiError } from '@shared/utils/api-error.util';

interface UpdateAddressDTO {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isDefault?: boolean;
}

export class UpdateAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(addressId: string, userId: string, data: UpdateAddressDTO): Promise<Address> {
    const address = await this.addressRepository.findById(addressId);
    
    if (!address) {
      throw ApiError.notFound('Address not found');
    }

    if (address.userId !== userId) {
      throw ApiError.forbidden('You can only update your own addresses');
    }

    if (data.isDefault) {
      await this.addressRepository.unsetDefaultForUser(userId);
    }

    const updatedAddress = await this.addressRepository.update(addressId, data);
    
    if (!updatedAddress) {
      throw ApiError.internal('Failed to update address');
    }

    return updatedAddress;
  }
}

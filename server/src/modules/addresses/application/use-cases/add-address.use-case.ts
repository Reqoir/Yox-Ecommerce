/**
 * @file add-address.use-case.ts
 * @layer Application › Use Cases
 */

import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { Address } from '../../domain/entities/address.entity';

interface AddAddressDTO {
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault?: boolean;
}

export class AddAddressUseCase {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(data: AddAddressDTO): Promise<Address> {
    // If it's the first address, make it default automatically
    const existingAddresses = await this.addressRepository.findByUserId(data.userId);
    
    let isDefault = data.isDefault || false;
    
    if (existingAddresses.length === 0) {
      isDefault = true;
    } else if (isDefault) {
      // If setting as default, unset other defaults first
      await this.addressRepository.unsetDefaultForUser(data.userId);
    }

    return this.addressRepository.create({
      ...data,
      isDefault,
    });
  }
}

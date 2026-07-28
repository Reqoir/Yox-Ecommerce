/**
 * @file address.repository.ts
 * @layer Infrastructure › Repositories
 */

import { BaseRepository } from '@core/infrastructure/repositories/base.repository';
import { Address } from '../../domain/entities/address.entity';
import { IAddressRepository } from '../../domain/repositories/address.repository.interface';
import { AddressModel, IAddressDocument } from '../models/address.model';

export class AddressRepository
  extends BaseRepository<Address, IAddressDocument>
  implements IAddressRepository
{
  constructor() {
    super(AddressModel);
  }

  protected toDomain(doc: IAddressDocument): Address {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      fullName: doc.fullName,
      phone: doc.phone,
      street: doc.street,
      city: doc.city,
      state: doc.state,
      country: doc.country,
      zipCode: doc.zipCode,
      isDefault: doc.isDefault,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const docs = await this.model.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    const doc = await this.model.findOne({ userId, isDefault: true }).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async unsetDefaultForUser(userId: string): Promise<void> {
    await this.model.updateMany({ userId }, { isDefault: false }).exec();
  }
}

/**
 * @file user.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the IUserRepository using Mongoose.
 */

import { BaseRepository } from '@core/infrastructure/repositories/base.repository';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IUserDocument, UserModel } from '../models/user.model';
import { FilterQuery } from 'mongoose';

export class UserRepository
  extends BaseRepository<User, IUserDocument>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  /**
   * Maps a Mongoose document to a Domain Entity
   */
  protected toDomain(doc: IUserDocument): User {
    return new User({
      id: doc.id,
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      password: doc.password,
      profileImage: doc.profileImage,
      roleId: doc.roleId,
      isEmailVerified: doc.isEmailVerified,
      isPhoneVerified: doc.isPhoneVerified,
      status: doc.status as any,
      lastLogin: doc.lastLogin,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  /**
   * Maps a Domain Entity to a format Mongoose can save
   */
  protected toPersistence(entity: User): Partial<IUserDocument> {
    return {
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      password: entity.password,
      profileImage: entity.profileImage,
      roleId: entity.roleId,
      isEmailVerified: entity.isEmailVerified,
      isPhoneVerified: entity.isPhoneVerified,
      status: entity.status as any,
      lastLogin: entity.lastLogin,
      deletedAt: entity.deletedAt,
    };
  }

  public async create(entity: User): Promise<User> {
    const rawData = this.toPersistence(entity);
    const doc = await this.model.create(rawData);
    return this.toDomain(doc);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email } as FilterQuery<IUserDocument>).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email } as FilterQuery<IUserDocument>).exec();
    return count > 0;
  }
}

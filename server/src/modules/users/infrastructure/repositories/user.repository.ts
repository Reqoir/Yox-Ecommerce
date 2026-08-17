/**
 * @file user.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the IUserRepository using Mongoose.
 */

import { BaseRepository } from '@core/infrastructure/repositories/base.repository';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IUserDocument, UserModel } from '../models/user.model';
import { FilterQuery } from 'mongoose';
import { PaginatedResult } from '@shared/types/common.types';

export class UserRepository
  extends BaseRepository<User, IUserDocument>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  protected buildSearchFilter(search: string): FilterQuery<IUserDocument> {
    const regex = new RegExp(search, 'i');
    return {
      $or: [
        { fullName: { $regex: regex } },
        { email: { $regex: regex } },
      ],
    } as FilterQuery<IUserDocument>;
  }

  public async findAll(query: any = {}): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search, roleId, status } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery: Record<string, 1 | -1> = { [sort]: sortOrder };

    const filter: FilterQuery<IUserDocument> = search ? this.buildSearchFilter(search) : {};

    if (roleId && roleId !== 'all') {
      filter.roleId = roleId;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [docs, totalItems] = await Promise.all([
      this.model.find(filter).sort(sortQuery).skip(skip).limit(Number(limit)).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / Number(limit));

    const meta = {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage: Number(limit),
      hasNextPage: Number(page) < totalPages,
      hasPreviousPage: Number(page) > 1,
    };

    return { data: docs.map((doc) => this.toDomain(doc)), meta };
  }

  /**
   * Maps a Mongoose document to a Domain Entity
   */
  protected toDomain(doc: IUserDocument): User {
    return User.reconstitute({
      id: doc.id,
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      password: doc.password,
      profileImage: doc.profileImage,
      roleId: doc.roleId,
      isEmailVerified: doc.isEmailVerified ?? false,
      isPhoneVerified: doc.isPhoneVerified ?? false,
      status: (doc.status as any) || UserStatus.ACTIVE,
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

  public async update(id: string, data: Partial<User>): Promise<User | null> {
    const rawData = data instanceof User ? this.toPersistence(data) : data;
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        rawData as any,
        { new: true, runValidators: true }
      )
      .exec();
      
    if (!doc) return null;
    return this.toDomain(doc);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const doc = await this.model.findOne({ email: normalizedEmail } as FilterQuery<IUserDocument>).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email } as FilterQuery<IUserDocument>).exec();
    return count > 0;
  }
}

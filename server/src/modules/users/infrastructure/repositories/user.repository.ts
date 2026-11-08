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
        { phone: { $regex: regex } },
      ],
    } as FilterQuery<IUserDocument>;
  }

  public async findAll(query: any = {}): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      roleId,
      status,
      customerRoleIds,
      excludeRoleIds,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery: Record<string, 1 | -1> = { [sort]: sortOrder };

    const filter: FilterQuery<IUserDocument> = search ? this.buildSearchFilter(search) : {};

    if (customerRoleIds && Array.isArray(customerRoleIds)) {
      filter.roleId = { $in: customerRoleIds };
    } else if (excludeRoleIds && Array.isArray(excludeRoleIds)) {
      filter.roleId = { $nin: excludeRoleIds };
    }

    if (query.deletedOnly === true || query.deletedOnly === 'true' || query.status === 'DELETED') {
      filter.deletedAt = { $ne: null };
    } else if (query.includeDeleted === true || query.includeDeleted === 'true') {
      // Don't filter deletedAt
    } else {
      filter.deletedAt = null;
    }

    if (roleId && roleId !== 'all') {
      filter.roleId = roleId;
    }
    if (status && status !== 'all' && status !== 'DELETED') {
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
    const raw: any = {
      fullName: entity.fullName,
      password: entity.password,
      profileImage: entity.profileImage || null,
      roleId: entity.roleId,
      isEmailVerified: entity.isEmailVerified ?? false,
      isPhoneVerified: entity.isPhoneVerified ?? false,
      status: (entity.status as any) || UserStatus.ACTIVE,
      lastLogin: entity.lastLogin || null,
      deletedAt: entity.deletedAt || null,
    };

    const cleanEmail =
      entity.email && !entity.email.endsWith('@user.yox.internal') && entity.email.trim()
        ? entity.email.trim().toLowerCase()
        : null;
    if (cleanEmail) {
      raw.email = cleanEmail;
    }

    const cleanPhone = entity.phone && entity.phone.trim() ? entity.phone.trim() : null;
    if (cleanPhone) {
      raw.phone = cleanPhone;
    }

    return raw;
  }

  public async create(entity: User): Promise<User> {
    const rawData = this.toPersistence(entity);
    const doc = await this.model.create(rawData);
    return this.toDomain(doc);
  }

  public async update(id: string, data: Partial<User>): Promise<User | null> {
    const rawData: any = data instanceof User ? this.toPersistence(data) : data;
    const updateQuery: any = { $set: {} };
    const unsetQuery: any = {};

    for (const [key, val] of Object.entries(rawData)) {
      if (key === 'email' && (!val || (typeof val === 'string' && val.endsWith('@user.yox.internal')))) {
        unsetQuery.email = 1;
      } else if (key === 'phone' && !val) {
        unsetQuery.phone = 1;
      } else if (val !== undefined) {
        updateQuery.$set[key] = val;
      }
    }

    if (Object.keys(unsetQuery).length > 0) {
      updateQuery.$unset = unsetQuery;
    }
    if (Object.keys(updateQuery.$set).length === 0) {
      delete updateQuery.$set;
    }

    const doc = await this.model
      .findByIdAndUpdate(
        id,
        updateQuery,
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
    const normalizedEmail = email.toLowerCase().trim();
    const count = await this.model.countDocuments({ email: normalizedEmail } as FilterQuery<IUserDocument>).exec();
    return count > 0;
  }

  public async existsByPhone(phone: string): Promise<boolean> {
    const trimmed = phone.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');
    const last10 = digitsOnly.slice(-10);

    const orConditions: any[] = [{ phone: trimmed }];
    if (digitsOnly) orConditions.push({ phone: digitsOnly });
    if (last10.length === 10) {
      orConditions.push({ phone: { $regex: new RegExp(`${last10}$`) } });
    }

    const count = await this.model.countDocuments({
      $or: orConditions,
    } as FilterQuery<IUserDocument>).exec();
    return count > 0;
  }

  public async findByPhone(phone: string): Promise<User | null> {
    const trimmed = phone.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');
    const last10 = digitsOnly.slice(-10);

    const orConditions: any[] = [{ phone: trimmed }];
    if (digitsOnly) orConditions.push({ phone: digitsOnly });
    if (last10.length === 10) {
      orConditions.push({ phone: { $regex: new RegExp(`${last10}$`) } });
    }

    const doc = await this.model.findOne({
      $or: orConditions,
    } as FilterQuery<IUserDocument>).exec();

    return doc ? this.toDomain(doc) : null;
  }

  public async findAllByPhone(phone: string): Promise<User[]> {
    const trimmed = phone.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');
    const last10 = digitsOnly.slice(-10);

    const orConditions: any[] = [{ phone: trimmed }];
    if (digitsOnly) orConditions.push({ phone: digitsOnly });
    if (last10.length === 10) {
      orConditions.push({ phone: { $regex: new RegExp(`${last10}$`) } });
    }

    const docs = await this.model.find({
      $or: orConditions,
    } as FilterQuery<IUserDocument>).exec();

    return docs.map((doc) => this.toDomain(doc));
  }
}

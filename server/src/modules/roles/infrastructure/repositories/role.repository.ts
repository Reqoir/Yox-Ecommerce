/**
 * @file role.repository.ts
 * @layer Infrastructure › Repositories
 */

import { BaseRepository } from '@core/infrastructure/repositories/base.repository';
import { Role } from '../../domain/entities/role.entity';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IRoleDocument, RoleModel } from '../models/role.model';
import { FilterQuery } from 'mongoose';

export class RoleRepository
  extends BaseRepository<Role, IRoleDocument>
  implements IRoleRepository
{
  constructor() {
    super(RoleModel);
  }

  protected toDomain(doc: IRoleDocument): Role {
    const roleName = doc.name ? doc.name.toUpperCase() : '';
    let defaultLevel = 50;
    if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') defaultLevel = 100;
    else if (roleName === 'CUSTOMER') defaultLevel = 0;
    else if (roleName === 'MANAGER') defaultLevel = 75;
    else if (roleName === 'EDITOR' || roleName === 'SUPPORT') defaultLevel = 50;

    let level = doc.level;
    // Auto-heal legacy unmigrated default levels (e.g. 20) for system roles
    if (level === undefined || (level === 20 && (roleName === 'ADMIN' || roleName === 'CUSTOMER' || roleName === 'MANAGER'))) {
      level = defaultLevel;
    }

    return Role.reconstitute({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      permissions: doc.permissions,
      level: level,
      isSystem: doc.isSystem,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  protected toPersistence(entity: Role): Partial<IRoleDocument> {
    return {
      name: entity.name,
      description: entity.description || undefined,
      permissions: entity.permissions,
      level: entity.level,
      isSystem: entity.isSystem,
    };
  }

  public async create(entity: Role): Promise<Role> {
    const rawData = this.toPersistence(entity);
    const doc = await this.model.create(rawData);
    return this.toDomain(doc);
  }

  public async update(id: string, data: Partial<Role>): Promise<Role | null> {
    const rawData = data instanceof Role ? this.toPersistence(data) : data;
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

  public async findByName(name: string): Promise<Role | null> {
    const doc = await this.model.findOne({ name } as FilterQuery<IRoleDocument>).exec();
    return doc ? this.toDomain(doc) : null;
  }
}

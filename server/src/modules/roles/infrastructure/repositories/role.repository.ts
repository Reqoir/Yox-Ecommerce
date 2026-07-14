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
    return Role.reconstitute({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      permissions: doc.permissions,
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
      isSystem: entity.isSystem,
    };
  }

  public async findByName(name: string): Promise<Role | null> {
    const doc = await this.model.findOne({ name } as FilterQuery<IRoleDocument>).exec();
    return doc ? this.toDomain(doc) : null;
  }
}

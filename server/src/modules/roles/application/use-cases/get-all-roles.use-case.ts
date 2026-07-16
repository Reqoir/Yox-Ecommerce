/**
 * @file get-all-roles.use-case.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { RoleDTO } from '../dtos/role.dto';

export class GetAllRolesUseCase implements IUseCase<void, RoleDTO[]> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(): Promise<RoleDTO[]> {
    const rolesResult = await this.roleRepository.findAll();
    return rolesResult.data.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || null,
      permissions: role.permissions,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }
}

/**
 * @file create-role.use-case.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ConflictError } from '@core/application/errors/application.error';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { CreateRoleRequestDTO, RoleDTO } from '../dtos/role.dto';

export class CreateRoleUseCase implements IUseCase<CreateRoleRequestDTO, RoleDTO> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(input: CreateRoleRequestDTO): Promise<RoleDTO> {
    const existing = await this.roleRepository.findByName(input.name.toUpperCase().trim());
    if (existing) {
      throw new ConflictError(`Role with name ${input.name} already exists`);
    }

    const role = Role.create(input);
    const savedRole = await this.roleRepository.create(role);

    return {
      id: savedRole.id,
      name: savedRole.name,
      description: savedRole.description || null,
      permissions: savedRole.permissions,
      isSystem: savedRole.isSystem,
      createdAt: savedRole.createdAt,
      updatedAt: savedRole.updatedAt,
    };
  }
}

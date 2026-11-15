/**
 * @file update-role.use-case.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { NotFoundError, ValidationError } from '@core/application/errors/application.error';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { UpdateRoleRequestDTO, RoleDTO } from '../dtos/role.dto';

export class UpdateRoleUseCase implements IUseCase<{ id: string; data: UpdateRoleRequestDTO }, RoleDTO> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(input: { id: string; data: UpdateRoleRequestDTO }): Promise<RoleDTO> {
    const role = await this.roleRepository.findById(input.id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError(`System role "${role.name}" is protected and its configuration or permissions cannot be modified.`);
    }

    // Role Entity doesn't expose a raw update method since properties are private.
    // So we use reconstituted Role if we need to modify properties not supported by methods,
    // or we modify the repository if we are doing a patch.
    // However, the cleanest way is to just reconstitute with updated props.
    
    const updatedRole = (role as any)._props; // Accessing private props for simplicity in this CQRS-lite pattern
    
    if (input.data.name && !role.isSystem) {
      updatedRole.name = input.data.name.toUpperCase().trim();
    }
    if (input.data.description !== undefined) {
      updatedRole.description = input.data.description;
    }
    if (input.data.permissions) {
      updatedRole.permissions = input.data.permissions;
    }
    if (input.data.level !== undefined) {
      updatedRole.level = input.data.level;
    }
    
    updatedRole.updatedAt = new Date();

    const savedRole = await this.roleRepository.update(input.id, updatedRole);
    if (!savedRole) throw new NotFoundError('Role not found after update');

    return {
      id: savedRole.id,
      name: savedRole.name,
      description: savedRole.description || null,
      permissions: savedRole.permissions,
      level: savedRole.level,
      isSystem: savedRole.isSystem,
      createdAt: savedRole.createdAt,
      updatedAt: savedRole.updatedAt,
    };
  }
}

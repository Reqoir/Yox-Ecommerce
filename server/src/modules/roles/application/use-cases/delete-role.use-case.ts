/**
 * @file delete-role.use-case.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { NotFoundError, ValidationError } from '@core/application/errors/application.error';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
// import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';

export class DeleteRoleUseCase implements IUseCase<string, void> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    // In a real scenario, you'd inject userRepository to prevent deleting roles that are in use
  ) {}

  public async execute(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('Cannot delete a system role');
    }

    // TODO: Check if any users have this role before deleting

    await this.roleRepository.delete(id);
  }
}

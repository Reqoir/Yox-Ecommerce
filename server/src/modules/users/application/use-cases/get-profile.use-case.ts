/**
 * @file get-profile.use-case.ts
 * @layer Application
 *
 * Use Case to fetch a user's own profile.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';

export class GetProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(userId: string): Promise<{ user: User; permissions: string[] }> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];

    return { user, permissions };
  }
}

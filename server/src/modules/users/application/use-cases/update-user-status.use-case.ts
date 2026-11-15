import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';
import { UserStatus } from '../../domain/entities/user.entity';
import { ApiError } from '@shared/utils/api-error.util';

export interface UpdateUserStatusDTO {
  userId: string;
  status: UserStatus;
  actor?: {
    isSuperAdmin?: boolean;
    permissions?: string[];
  };
}

export class UpdateUserStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(dto: UpdateUserStatusDTO) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.email && user.email.toLowerCase() === 'admin@yox.com') {
      throw ApiError.forbidden('The primary Store Owner account cannot be suspended or deactivated.');
    }

    if (user.deletedAt) {
      if (dto.status === UserStatus.ACTIVE) {
        // Enforce explicit authorization for restoring archived accounts
        const isAuthorizedToRestore =
          dto.actor?.isSuperAdmin || (dto.actor?.permissions || []).includes('manage_users');
        if (!isAuthorizedToRestore) {
          throw ApiError.forbidden('Only authorized administrators can restore archived user accounts.');
        }
        user.restore();
      } else {
        throw ApiError.badRequest('Cannot change status of an archived account without restoring it first.');
      }
    } else {
      user.updateStatus(dto.status);
    }

    const updatedUser = await this.userRepository.update(user.id, user);
    if (!updatedUser) {
      throw new Error('Failed to update user status');
    }

    const userJson = updatedUser.toJSON();
    delete (userJson as any).password;

    return userJson;
  }
}

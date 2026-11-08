import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';
import { UserStatus } from '../../domain/entities/user.entity';
import { ApiError } from '@shared/utils/api-error.util';

export interface UpdateUserStatusDTO {
  userId: string;
  status: UserStatus;
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

    if (dto.status === UserStatus.ACTIVE && user.deletedAt) {
      user.restore();
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

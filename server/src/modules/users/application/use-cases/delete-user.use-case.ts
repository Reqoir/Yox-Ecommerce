import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';
import { ApiError } from '@shared/utils/api-error.util';

export interface DeleteUserDTO {
  userId: string;
}

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(dto: DeleteUserDTO): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.email && user.email.toLowerCase() === 'admin@yox.com') {
      throw ApiError.forbidden('The primary Store Owner account cannot be deleted or deactivated.');
    }

    user.deactivate();

    const updatedUser = await this.userRepository.update(user.id, user);
    if (!updatedUser) {
      throw new Error('Failed to delete/deactivate user');
    }

    return { success: true, message: 'User account has been deactivated successfully' };
  }
}

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';
import { UserStatus } from '../../domain/entities/user.entity';

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

    user.updateStatus(dto.status);

    const updatedUser = await this.userRepository.update(user.id, user);
    if (!updatedUser) {
      throw new Error('Failed to update user status');
    }

    const userJson = updatedUser.toJSON();
    delete (userJson as any).password;

    return userJson;
  }
}

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';

export interface UpdateUserRoleDTO {
  userId: string;
  roleId: string;
}

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(dto: UpdateUserRoleDTO) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update the roleId
    user.updateRole(dto.roleId);

    const updatedUser = await this.userRepository.update(user.id, user);

    const userJson = updatedUser.toJSON();
    delete (userJson as any).password;
    
    return userJson;
  }
}

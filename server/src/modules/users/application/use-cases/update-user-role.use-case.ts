import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';

export interface UpdateUserRoleDTO {
  userId: string;
  roleId: string;
}

export class UpdateUserRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(dto: UpdateUserRoleDTO) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Update the roleId
    user.updateRole(dto.roleId);

    const updatedUser = await this.userRepository.update(user.id, user);

    const userJson = updatedUser.toJSON();
    delete (userJson as any).password;
    
    return userJson;
  }
}

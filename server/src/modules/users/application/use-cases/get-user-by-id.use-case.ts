import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { NotFoundError } from '@core/application/errors/application.error';

export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];

    const userJson = user.toJSON();
    delete (userJson as any).password;

    return {
      ...userJson,
      permissions,
      roleName: role ? role.name : 'Unknown',
    };
  }
}

import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';
import { LoginResponseDTO } from '../dtos/login.dto';

export class GetMeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(userId: string): Promise<{ user: LoginResponseDTO['user'] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('Your account has been deactivated or suspended');
    }

    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        permissions,
      }
    };
  }
}

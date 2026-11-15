import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { NotFoundError, ConflictError, ValidationError } from '@core/application/errors/application.error';
import { ApiError } from '@shared/utils/api-error.util';

export interface UpdateUserRoleDTO {
  userId: string;
  roleId: string;
  email?: string;
  password?: string;
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

    if (user.email && user.email.toLowerCase() === 'admin@yox.com') {
      throw ApiError.forbidden('The primary Store Owner role cannot be modified.');
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const isStaffRole = role.name.toUpperCase() !== 'CUSTOMER';

    // If assigning staff role, ensure there is an email for admin login
    const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
    const existingEmail =
      user.email && !user.email.endsWith('@user.yox.internal') ? user.email.toLowerCase().trim() : null;
    const resolvedEmail = cleanEmail || existingEmail;

    if (isStaffRole && !resolvedEmail) {
      throw new ValidationError(
        'A valid email address is required for staff members so they can log into the Admin Dashboard.'
      );
    }

    // Update email if new email is provided and differs from current
    if (cleanEmail && cleanEmail !== existingEmail) {
      const emailTaken = await this.userRepository.findByEmail(cleanEmail);
      if (emailTaken && emailTaken.id !== user.id) {
        throw new ConflictError(`User with email "${cleanEmail}" already exists.`);
      }
      user.updateProfile({ email: cleanEmail, isEmailVerified: true });
    } else if (existingEmail) {
      user.updateProfile({ isEmailVerified: true });
    }

    // Do not permit modifying soft-deleted / archived accounts through role endpoint
    if (user.deletedAt) {
      throw ApiError.badRequest('Cannot change role of an archived/deleted account. The account must be explicitly restored by an authorized administrator first.');
    }

    // Update the roleId
    user.updateRole(dto.roleId);

    const updatedUser = await this.userRepository.update(user.id, user);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    const userJson = updatedUser.toJSON();
    delete (userJson as any).password;

    return userJson;
  }
}

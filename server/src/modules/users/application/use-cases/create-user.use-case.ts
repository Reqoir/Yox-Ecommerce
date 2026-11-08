/**
 * @file create-user.use-case.ts
 * @layer Application
 *
 * Use Case for admin to create a new user/staff with a specific role.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ConflictError, NotFoundError, ValidationError } from '@core/application/errors/application.error';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { hashPassword } from '@shared/utils/password.helper';

export interface CreateUserRequestDTO {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  roleId: string;
}

export interface CreateUserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  status: string;
  createdAt: Date;
}

export class CreateUserUseCase implements IUseCase<CreateUserRequestDTO, CreateUserResponseDTO> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository?: IRoleRepository
  ) {}

  async execute(input: CreateUserRequestDTO): Promise<CreateUserResponseDTO> {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone && input.phone.trim() ? input.phone.trim() : undefined;
    const cleanFullName = input.fullName.trim();

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      throw new ValidationError('A valid 10-digit contact mobile phone number is required for all staff and admin accounts.');
    }

    // 1. Check if email already exists
    const existingUserByEmail = await this.userRepository.findByEmail(cleanEmail);
    if (existingUserByEmail && !existingUserByEmail.deletedAt) {
      throw new ConflictError(`User with email "${cleanEmail}" already exists.`);
    }

    // 2. Check if phone already exists (if provided)
    let existingUserByPhone: User | null = null;
    if (cleanPhone) {
      existingUserByPhone = await this.userRepository.findByPhone(cleanPhone);
      if (existingUserByPhone && !existingUserByPhone.deletedAt && existingUserByPhone.id !== existingUserByEmail?.id) {
        throw new ConflictError(`User with phone "${cleanPhone}" already exists.`);
      }
    }

    // 3. Validate Role
    if (this.roleRepository) {
      const role = await this.roleRepository.findById(input.roleId);
      if (!role) {
        throw new NotFoundError('Selected staff role does not exist.');
      }
      if (role.name.toUpperCase() === 'CUSTOMER') {
        throw new ConflictError('Cannot assign customer role to an internal staff member.');
      }
    }

    // 4. Default password fallback
    const password = input.password || 'StaffTemp123!';

    // 5. If an archived (soft-deleted) user matches by email or phone, restore and reactivate them
    const targetArchivedUser =
      (existingUserByEmail?.deletedAt ? existingUserByEmail : null) ||
      (existingUserByPhone?.deletedAt ? existingUserByPhone : null);

    if (targetArchivedUser) {
      targetArchivedUser.restore();
      targetArchivedUser.updateProfile({
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone || targetArchivedUser.phone,
        isEmailVerified: true,
      });
      targetArchivedUser.updateRole(input.roleId);
      const hashedPassword = await hashPassword(password);
      targetArchivedUser.updatePassword(hashedPassword);

      const savedUser = await this.userRepository.update(targetArchivedUser.id, targetArchivedUser);
      if (!savedUser) {
        throw new Error('Failed to restore staff member account.');
      }

      return {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        roleId: savedUser.roleId,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
      };
    }

    // 6. Create user entity
    const userEntity = await User.create({
      fullName: cleanFullName,
      email: cleanEmail,
      password: password,
      phone: cleanPhone || null,
      roleId: input.roleId,
      isEmailVerified: true,
    });

    const savedUser = await this.userRepository.create(userEntity);

    return {
      id: savedUser.id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      roleId: savedUser.roleId,
      status: savedUser.status,
      createdAt: savedUser.createdAt,
    };
  }
}

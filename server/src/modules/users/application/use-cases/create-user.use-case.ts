/**
 * @file create-user.use-case.ts
 * @layer Application
 *
 * Use Case for admin to create a new user/staff with a specific role.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ConflictError } from '@core/application/errors/application.error';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

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
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserRequestDTO): Promise<CreateUserResponseDTO> {
    const exists = await this.userRepository.existsByEmail(input.email);
    if (exists) {
      throw new ConflictError(`User with email ${input.email} already exists`);
    }

    // Generate a default password if not provided
    const password = input.password || 'TempPassword123!';

    const userEntity = await User.create({
      fullName: input.fullName,
      email: input.email,
      password: password,
      phone: input.phone,
      roleId: input.roleId,
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

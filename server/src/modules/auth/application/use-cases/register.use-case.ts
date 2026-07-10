/**
 * @file register.use-case.ts
 * @layer Application › Use Cases
 * 
 * Handles the business logic for registering a new user.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ConflictError } from '@core/application/errors/application.error';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { RegisterUserRequestDTO, RegisterUserResponseDTO } from '../dtos/register.dto';

export class RegisterUserUseCase implements IUseCase<RegisterUserRequestDTO, RegisterUserResponseDTO> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserRequestDTO): Promise<RegisterUserResponseDTO> {
    // 1. Check if email is already taken
    const exists = await this.userRepository.existsByEmail(input.email);
    if (exists) {
      throw new ConflictError(`User with email ${input.email} already exists`);
    }

    // 2. Create the Domain Entity (applies business rules & hashes password)
    const userEntity = await User.create({
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      phone: input.phone, // Optional
      roleId: 'CUSTOMER_ROLE_ID', // Hardcoded default role for now
    });

    // 3. Persist to Infrastructure (Database)
    const savedUser = await this.userRepository.create(userEntity);

    // 4. Return safe DTO
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

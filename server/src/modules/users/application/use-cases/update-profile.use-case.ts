/**
 * @file update-profile.use-case.ts
 * @layer Application
 *
 * Use Case to update a user's own profile.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UpdateProfileRequestDTO } from '../dtos/update-profile.dto';
import { User } from '../../domain/entities/user.entity';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string, data: UpdateProfileRequestDTO): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    // Since our User entity is encapsulated, we should add an `updateProfile` method to it.
    user.updateProfile({
      fullName: data.fullName,
      phone: data.phone,
      profileImage: data.profileImage,
    });

    const updatedUser = await this.userRepository.update(userId, user);
    
    if (!updatedUser) {
      throw ApiError.internal('Failed to update user profile');
    }

    return updatedUser;
  }
}

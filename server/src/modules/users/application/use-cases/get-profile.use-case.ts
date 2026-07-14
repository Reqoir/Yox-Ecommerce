/**
 * @file get-profile.use-case.ts
 * @layer Application
 *
 * Use Case to fetch a user's own profile.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return user;
  }
}

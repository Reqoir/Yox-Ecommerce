import crypto from 'crypto';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { signResetToken } from '@shared/utils/jwt.helper';
import { getRedisClient } from '@core/infrastructure/database/redis/client';

export class ForgotPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    
    // We always return the same message to avoid user enumeration attacks
    const successMessage = 'If that email address is in our database, we will send you an email to reset your password.';

    if (!user) {
      return { message: successMessage };
    }

    if (!user.canLogin()) {
      return { message: successMessage };
    }

    // Generate unique single-use token identifier (jti)
    const jti = crypto.randomUUID();

    // Store in Redis with strict 15-minute (900 seconds) expiration
    try {
      const redis = getRedisClient();
      await redis.set(`pwd_reset:${jti}`, user.id, 'EX', 900);
    } catch {
      // If Redis persistence fails, reject request safely
      throw new Error('Unable to process password reset request at this time. Please try again.');
    }

    const resetToken = signResetToken({ sub: user.id, jti });
    void resetToken; // Ready for transactional email dispatch; token is never logged to stdout

    return { message: successMessage };
  }
}

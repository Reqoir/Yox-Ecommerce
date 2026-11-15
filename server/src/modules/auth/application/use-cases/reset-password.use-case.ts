import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';
import { verifyResetToken } from '@shared/utils/jwt.helper';
import { ResetPasswordRequestDTO } from '../dtos/reset-password.dto';
import { hashPassword } from '@shared/utils/password.helper';
import { getRedisClient } from '@core/infrastructure/database/redis/client';

export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(data: ResetPasswordRequestDTO): Promise<void> {
    try {
      // 1. Verify the token signature and extract payload
      const payload = verifyResetToken(data.token);

      if (!payload.jti) {
        throw ApiError.badRequest('Invalid or expired password reset token');
      }

      // 2. Atomically verify and consume the token from Redis (GETDEL / Lua script)
      // This strictly prevents token replay and concurrent race condition attacks
      const redis = getRedisClient();
      const redisKey = `pwd_reset:${payload.jti}`;
      let storedUserId: string | null = null;

      try {
        if (typeof (redis as any).getdel === 'function') {
          storedUserId = await (redis as any).getdel(redisKey);
        } else {
          const lua = "local val = redis.call('GET', KEYS[1]) if val then redis.call('DEL', KEYS[1]) end return val";
          storedUserId = (await redis.eval(lua, 1, redisKey)) as string | null;
        }
      } catch (redisErr: any) {
        if (redisErr.message && redisErr.message.includes('unknown command')) {
          const lua = "local val = redis.call('GET', KEYS[1]) if val then redis.call('DEL', KEYS[1]) end return val";
          storedUserId = (await redis.eval(lua, 1, redisKey)) as string | null;
        } else {
          throw redisErr;
        }
      }

      if (!storedUserId || storedUserId !== payload.sub) {
        throw ApiError.badRequest('This password reset link is invalid or has already been used.');
      }

      // 3. Find the user
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw ApiError.badRequest('Invalid or expired password reset token');
      }

      if (!user.canLogin()) {
        throw ApiError.unauthorized('Your account has been deactivated or suspended');
      }

      // 4. Hash the new password and update entity
      // updatePassword automatically increments tokenVersion, invalidating all previous JWT sessions
      const hashedPassword = await hashPassword(data.password);
      user.updatePassword(hashedPassword);

      // 5. Save the updated user to database
      await this.userRepository.update(user.id, user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest('Invalid or expired password reset token');
    }
  }
}

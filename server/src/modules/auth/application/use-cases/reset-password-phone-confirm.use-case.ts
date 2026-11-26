/**
 * @file reset-password-phone-confirm.use-case.ts
 * @layer Application › Use Cases
 * 
 * Finalizes password reset for the specifically selected user account.
 * Guarantees that only the targeted account's password is changed.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import {
  ResetPasswordPhoneConfirmRequestDTO,
  ResetPasswordPhoneResponseDTO,
} from '../dtos/reset-password-phone.dto';
import { verifyResetToken } from '@shared/utils/jwt.helper';
import { hashPassword } from '@shared/utils/password.helper';
import { getRedisClient } from '@core/infrastructure/database/redis/client';
import { env } from '@core/infrastructure/config/env';

export class ResetPasswordPhoneConfirmUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository?: IRoleRepository
  ) {}

  public async execute(data: ResetPasswordPhoneConfirmRequestDTO): Promise<ResetPasswordPhoneResponseDTO> {
    if (!data.resetToken || !data.userId || !data.newPassword) {
      throw ApiError.badRequest('Reset token, account ID, and new password are required');
    }

    if (data.newPassword.length < 8 || data.newPassword.length > 128) {
      throw ApiError.badRequest('Password must be between 8 and 128 characters.');
    }

    // 1. Verify reset token (short-lived 15m JWT_RESET_SECRET)
    let payload: any;
    try {
      payload = verifyResetToken(data.resetToken);
    } catch {
      throw ApiError.unauthorized('Password reset session has expired. Please verify your mobile number again.');
    }

    if (payload.purpose !== 'phone_password_reset' || !Array.isArray(payload.candidateIds) || !payload.jti) {
      throw ApiError.unauthorized('Invalid password reset session. Please try again.');
    }

    // Enforce single-use reset token consumption (fail closed in production if Redis is unavailable)
    try {
      const redis = getRedisClient();
      if (redis && redis.status === 'ready') {
        const consumed = await redis.del(`pwd_reset_phone:${payload.jti}`);
        if (consumed === 0) {
          throw ApiError.unauthorized('This password reset link has already been used or expired.');
        }
      } else if (env.NODE_ENV === 'production') {
        throw ApiError.internal('Unable to validate password reset session at this time. Please try again.');
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      if (env.NODE_ENV === 'production') {
        throw ApiError.internal('Unable to validate password reset session at this time. Please try again.');
      }
    }

    // 2. Ensure selected account is part of the verified candidates
    if (!payload.candidateIds.includes(data.userId)) {
      throw ApiError.forbidden('Selected account does not belong to this verified mobile session.');
    }

    // 3. Find the selected user and verify it is not a privileged account
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw ApiError.notFound('Selected account was not found.');
    }

    if (user.email?.toLowerCase() === 'admin@yox.com') {
      throw ApiError.forbidden('Administrative accounts cannot reset passwords via customer mobile OTP.');
    }
    if (user.roleId && this.roleRepository) {
      try {
        const role = await this.roleRepository.findById(user.roleId);
        if (
          role &&
          (role.name.toUpperCase() !== 'CUSTOMER' || role.level > 0 || role.permissions.includes('*'))
        ) {
          throw ApiError.forbidden('Staff accounts cannot reset passwords via customer mobile OTP.');
        }
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
      }
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('This account has been deactivated or suspended. Please contact support.');
    }

    // 4. Update ONLY this user's password (also increments tokenVersion)
    const hashedPassword = await hashPassword(data.newPassword);
    user.updatePassword(hashedPassword);
    await this.userRepository.update(user.id, user);

    return {
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    };
  }
}

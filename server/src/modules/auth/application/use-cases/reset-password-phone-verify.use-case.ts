/**
 * @file reset-password-phone-verify.use-case.ts
 * @layer Application › Use Cases
 * 
 * Verifies mobile number + MSG91 OTP for password reset.
 * If multiple accounts exist for the phone, returns candidate accounts for user selection.
 */

import crypto from 'crypto';
import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import {
  ResetPasswordPhoneVerifyRequestDTO,
  ResetPasswordPhoneVerifyResponseDTO,
  CandidateAccountInfo,
} from '../dtos/reset-password-phone.dto';
import { signResetToken } from '@shared/utils/jwt.helper';
import { msg91OtpService } from '../../infrastructure/services/msg91-otp.service';
import { maskEmail } from './login-phone.use-case';
import { getRedisClient } from '@core/infrastructure/database/redis/client';
import { env } from '@core/infrastructure/config/env';

export class ResetPasswordPhoneVerifyUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository?: IRoleRepository
  ) {}

  public async execute(data: ResetPasswordPhoneVerifyRequestDTO): Promise<ResetPasswordPhoneVerifyResponseDTO> {
    const rawPhone = data.phone.trim();

    // 1. Verify OTP token with MSG91
    await msg91OtpService.verifyToken(data.verificationToken, rawPhone);

    // 2. Find all active customer accounts linked with this mobile number
    // Privileged staff/admin accounts cannot be recovered via customer phone OTP flows.
    const users = await this.userRepository.findAllByPhone(rawPhone);
    const activeUsers = users.filter((u) => u.canLogin());

    const customerUsers = [];
    let hasPrivileged = false;
    for (const u of activeUsers) {
      let isPrivileged = u.email?.toLowerCase() === 'admin@yox.com';
      if (!isPrivileged && u.roleId && this.roleRepository) {
        try {
          const role = await this.roleRepository.findById(u.roleId);
          if (
            role &&
            (role.name.toUpperCase() !== 'CUSTOMER' || role.level > 0 || role.permissions.includes('*'))
          ) {
            isPrivileged = true;
          }
        } catch {
          // fallback
        }
      }
      if (isPrivileged) {
        hasPrivileged = true;
      } else {
        customerUsers.push(u);
      }
    }

    if (activeUsers.length > 0 && customerUsers.length === 0 && hasPrivileged) {
      throw ApiError.forbidden(
        'Administrative and staff accounts cannot reset passwords via customer mobile OTP. Please contact your store administrator.'
      );
    }

    if (customerUsers.length === 0) {
      throw ApiError.notFound('No active account found with this mobile number. Please sign up or check the number.');
    }

    // 3. Generate a short-lived (15m), single-use resetToken identifying the candidates
    const jti = crypto.randomUUID();
    try {
      const redis = getRedisClient();
      if (redis && redis.status === 'ready') {
        await redis.set(`pwd_reset_phone:${jti}`, customerUsers.map((u) => u.id).join(','), 'EX', 900);
      } else if (env.NODE_ENV === 'production') {
        throw ApiError.internal('Unable to process password reset request at this time. Please try again.');
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      if (env.NODE_ENV === 'production') {
        throw ApiError.internal('Unable to process password reset request at this time. Please try again.');
      }
    }

    const resetToken = signResetToken({
      sub: customerUsers[0].id,
      jti,
      phone: rawPhone,
      candidateIds: customerUsers.map((u) => u.id),
      purpose: 'phone_password_reset',
    });

    const formatAccount = (u: any): CandidateAccountInfo => ({
      id: u.id,
      fullName: u.fullName,
      maskedEmail: maskEmail(u.email),
      createdAt: u.createdAt,
    });

    // 4. Multiple accounts: prompt user to pick the account
    if (customerUsers.length > 1) {
      return {
        multipleAccounts: true,
        resetToken,
        accounts: customerUsers.map(formatAccount),
      };
    }

    // 5. Single account: proceed directly
    return {
      multipleAccounts: false,
      resetToken,
      user: formatAccount(customerUsers[0]),
    };
  }
}

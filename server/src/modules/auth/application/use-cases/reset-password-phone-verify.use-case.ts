/**
 * @file reset-password-phone-verify.use-case.ts
 * @layer Application › Use Cases
 * 
 * Verifies mobile number + MSG91 OTP for password reset.
 * If multiple accounts exist for the phone, returns candidate accounts for user selection.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import {
  ResetPasswordPhoneVerifyRequestDTO,
  ResetPasswordPhoneVerifyResponseDTO,
  CandidateAccountInfo,
} from '../dtos/reset-password-phone.dto';
import { signAccessToken } from '@shared/utils/jwt.helper';
import { msg91OtpService } from '../../infrastructure/services/msg91-otp.service';
import { maskEmail } from './login-phone.use-case';

export class ResetPasswordPhoneVerifyUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(data: ResetPasswordPhoneVerifyRequestDTO): Promise<ResetPasswordPhoneVerifyResponseDTO> {
    const rawPhone = data.phone.trim();

    // 1. Verify OTP token with MSG91
    await msg91OtpService.verifyToken(data.verificationToken, rawPhone);

    // 2. Find all active accounts linked with this mobile number
    const users = await this.userRepository.findAllByPhone(rawPhone);
    const activeUsers = users.filter((u) => u.canLogin());

    if (activeUsers.length === 0) {
      throw ApiError.notFound('No active account found with this mobile number. Please sign up or check the number.');
    }

    // 3. Generate a secure, time-limited resetToken identifying the candidates
    const resetToken = signAccessToken({
      phone: rawPhone,
      candidateIds: activeUsers.map((u) => u.id),
      purpose: 'phone_password_reset',
    });

    const formatAccount = (u: any): CandidateAccountInfo => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email && !u.email.endsWith('@user.yox.internal') ? u.email : null,
      maskedEmail: maskEmail(u.email),
      createdAt: u.createdAt,
    });

    // 4. Multiple accounts: prompt user to pick the account
    if (activeUsers.length > 1) {
      return {
        multipleAccounts: true,
        resetToken,
        accounts: activeUsers.map(formatAccount),
      };
    }

    // 5. Single account: proceed directly
    return {
      multipleAccounts: false,
      resetToken,
      user: formatAccount(activeUsers[0]),
    };
  }
}

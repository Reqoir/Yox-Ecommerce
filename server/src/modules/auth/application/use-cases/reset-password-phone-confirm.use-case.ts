/**
 * @file reset-password-phone-confirm.use-case.ts
 * @layer Application › Use Cases
 * 
 * Finalizes password reset for the specifically selected user account.
 * Guarantees that only the targeted account's password is changed.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import {
  ResetPasswordPhoneConfirmRequestDTO,
  ResetPasswordPhoneResponseDTO,
} from '../dtos/reset-password-phone.dto';
import { verifyAccessToken } from '@shared/utils/jwt.helper';
import { hashPassword } from '@shared/utils/password.helper';

export class ResetPasswordPhoneConfirmUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(data: ResetPasswordPhoneConfirmRequestDTO): Promise<ResetPasswordPhoneResponseDTO> {
    if (!data.resetToken || !data.userId || !data.newPassword) {
      throw ApiError.badRequest('Reset token, account ID, and new password are required');
    }

    // 1. Verify reset token
    let payload: any;
    try {
      payload = verifyAccessToken(data.resetToken);
    } catch {
      throw ApiError.unauthorized('Password reset session has expired. Please verify your mobile number again.');
    }

    if (payload.purpose !== 'phone_password_reset' || !Array.isArray(payload.candidateIds)) {
      throw ApiError.unauthorized('Invalid password reset session. Please try again.');
    }

    // 2. Ensure selected account is part of the verified candidates
    if (!payload.candidateIds.includes(data.userId)) {
      throw ApiError.forbidden('Selected account does not belong to this verified mobile session.');
    }

    // 3. Find the selected user
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw ApiError.notFound('Selected account was not found.');
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('This account has been deactivated or suspended. Please contact support.');
    }

    // 4. Update ONLY this user's password
    const hashedPassword = await hashPassword(data.newPassword);
    user.updatePassword(hashedPassword);
    await this.userRepository.update(user.id, user);

    return {
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    };
  }
}

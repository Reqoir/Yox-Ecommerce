import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';
import { comparePassword, hashPassword } from '@shared/utils/password.helper';
import { ChangePasswordRequestDTO } from '../dtos/change-password.dto';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string, data: ChangePasswordRequestDTO): Promise<{ message: string }> {
    // 1. Validate matching confirmation password if provided
    if (data.confirmPassword && data.confirmPassword !== data.newPassword) {
      throw ApiError.badRequest('New password and confirmation password do not match');
    }

    // 2. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('Your account has been deactivated or suspended');
    }

    // 3. Verify current password
    if (!user.password) {
      throw ApiError.badRequest('No password is set on this account. Please use Mobile OTP verification to set a password.');
    }
    const isCurrentValid = await comparePassword(data.currentPassword, user.password);
    if (!isCurrentValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // 4. Ensure new password is not identical to current password
    const isSamePassword = await comparePassword(data.newPassword, user.password);
    if (isSamePassword) {
      throw ApiError.badRequest('New password cannot be the same as your current password');
    }

    // 5. Hash new password and update user entity
    const hashedPassword = await hashPassword(data.newPassword);
    user.updatePassword(hashedPassword);

    // 6. Save updated user
    await this.userRepository.update(user.id, user);

    // 7. Record audit log entry
    try {
      await AuditLogService.getInstance()?.record({
        actorId: user.id,
        actorRole: 'ADMIN',
        action: AuditAction.USER_UPDATED,
        resourceType: 'USER',
        resourceId: user.id,
        description: 'Admin/Staff changed account security password',
        metadata: {
          updatedFields: ['password'],
        },
      });
    } catch {
      // Non-blocking audit record failure
    }

    return { message: 'Password changed successfully' };
  }
}

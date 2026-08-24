import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';
import { verifyResetToken } from '@shared/utils/jwt.helper';
import { ResetPasswordRequestDTO } from '../dtos/reset-password.dto';
import { hashPassword } from '@shared/utils/password.helper';

export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(data: ResetPasswordRequestDTO): Promise<void> {
    try {
      // 1. Verify the token and extract the user ID
      const payload = verifyResetToken(data.token);

      // 2. Find the user
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw ApiError.badRequest('Invalid or expired password reset token');
      }

      if (!user.canLogin()) {
        throw ApiError.unauthorized('Your account has been deactivated or suspended');
      }

      // 3. Hash the new password and update the entity
      const hashedPassword = await hashPassword(data.password);
      user.updatePassword(hashedPassword);

      // 4. Save the user
      await this.userRepository.update(user.id, user);

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest('Invalid or expired password reset token');
    }
  }
}

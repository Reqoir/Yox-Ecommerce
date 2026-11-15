import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(token: string): Promise<RefreshTokenResponseDTO> {
    if (!token) {
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }

    try {
      // 1. Verify the refresh token
      const payload = verifyRefreshToken(token);

      // 2. Fetch the user to ensure they still exist and can login
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw ApiError.unauthorized('User no longer exists');
      }

      if (!user.canLogin()) {
        throw ApiError.unauthorized('Your staff account has been deactivated or suspended by the administrator.');
      }

      // Check exact equality of tokenVersion to prevent replaying old revoked refresh tokens
      const userTokenVersion = user.tokenVersion ?? 0;
      const payloadTokenVersion = payload.tokenVersion ?? 0;
      if (payloadTokenVersion !== userTokenVersion) {
        throw ApiError.unauthorized('Session has been revoked due to a password change or security update. Please log in again.');
      }

      // 3. Generate new tokens
      const tokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.roleId,
        tokenVersion: userTokenVersion,
      };

      const accessToken = signAccessToken(tokenPayload);
      const newRefreshToken = signRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Catch JWT errors (expired, invalid signature, etc)
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }
  }
}

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
      throw ApiError.unauthorized('Refresh token is required');
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
        throw ApiError.unauthorized('Your account has been deactivated or suspended');
      }

      // 3. Generate new tokens
      const tokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.roleId,
      };

      const accessToken = signAccessToken(tokenPayload);
      const newRefreshToken = signRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      // Catch JWT errors (expired, invalid signature, etc)
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }
}

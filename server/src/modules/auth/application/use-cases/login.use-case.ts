/**
 * @file login.use-case.ts
 * @layer Application
 *
 * Use Case for user login.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { LoginRequestDTO, LoginResponseDTO } from '../dtos/login.dto';
import { comparePassword } from '@shared/utils/password.helper';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(data: LoginRequestDTO): Promise<LoginResponseDTO> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 2. Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 3. Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.roleId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // 4. Return user info and tokens
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
      },
      accessToken,
      refreshToken,
    };
  }
}

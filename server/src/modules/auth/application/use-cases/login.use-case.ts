/**
 * @file login.use-case.ts
 * @layer Application
 *
 * Use Case for user login.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { LoginRequestDTO, LoginResponseDTO } from '../dtos/login.dto';
import { comparePassword } from '@shared/utils/password.helper';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(data: LoginRequestDTO): Promise<LoginResponseDTO> {
    // 1. Find user by email or phone number
    const identifier = data.email.trim();
    let user = null;

    if (identifier.includes('@')) {
      const emailUser = await this.userRepository.findByEmail(identifier.toLowerCase());
      if (emailUser && (await comparePassword(data.password, emailUser.password))) {
        user = emailUser;
      }
    } else {
      // Find all candidates with this phone number and match password
      const candidateUsers = await this.userRepository.findAllByPhone(identifier);
      for (const candidate of candidateUsers) {
        if (await comparePassword(data.password, candidate.password)) {
          user = candidate;
          break;
        }
      }

      // Fallback: check as email in case of non-standard email
      if (!user) {
        const emailUser = await this.userRepository.findByEmail(identifier.toLowerCase());
        if (emailUser && (await comparePassword(data.password, emailUser.password))) {
          user = emailUser;
        }
      }
    }

    if (!user) {
      throw ApiError.unauthorized('Invalid email/mobile or password');
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('Your account has been deactivated or suspended. Please contact support.');
    }

    // 3. Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.roleId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // 4. Fetch Role to get permissions
    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];
    const roleName = role ? role.name.toUpperCase() : 'CUSTOMER';

    // 5. Return user info and tokens
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        role: roleName,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }
}

/**
 * @file login-phone.use-case.ts
 * @layer Application › Use Cases
 * 
 * Use Case for authenticating a customer via mobile number & MSG91 OTP.
 * Intelligently handles multiple accounts sharing the same mobile number.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { LoginPhoneRequestDTO, LoginPhoneResponseDTO } from '../dtos/login-phone.dto';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';
import { msg91OtpService } from '../../infrastructure/services/msg91-otp.service';

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '';
  if (email.endsWith('@user.yox.internal')) return 'Mobile Account';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}***${last}@${domain}`;
}

export class LoginPhoneUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(data: LoginPhoneRequestDTO): Promise<LoginPhoneResponseDTO> {
    const rawPhone = data.phone.trim();

    // 1. Verify OTP token with MSG91
    await msg91OtpService.verifyToken(data.verificationToken, rawPhone);

    // 2. Find all users associated with this mobile number
    const users = await this.userRepository.findAllByPhone(rawPhone);
    const activeUsers = users.filter((u) => u.canLogin());

    if (activeUsers.length === 0) {
      throw ApiError.notFound('No active account found with this mobile number. Please sign up to create your account.');
    }

    // 3. If multiple accounts found, prompt user to select which account to access
    if (activeUsers.length > 1) {
      const selectionToken = signAccessToken({
        phone: rawPhone,
        purpose: 'phone_account_selection',
        candidateIds: activeUsers.map((u) => u.id),
      });

      return {
        multipleAccounts: true,
        selectionToken,
        accounts: activeUsers.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email && !u.email.endsWith('@user.yox.internal') ? u.email : null,
          maskedEmail: maskEmail(u.email),
          createdAt: u.createdAt,
        })),
      };
    }

    // 4. Single account: proceed directly with authentication
    const user = activeUsers[0];

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.roleId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Fetch Role for permissions
    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];
    const roleName = role ? role.name.toUpperCase() : 'CUSTOMER';

    return {
      multipleAccounts: false,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email && !user.email.endsWith('@user.yox.internal') ? user.email : null,
        phone: user.phone ?? undefined,
        roleId: user.roleId,
        role: roleName,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }
}

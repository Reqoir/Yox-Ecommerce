/**
 * @file login-phone.use-case.ts
 * @layer Application › Use Cases
 * 
 * Use Case for authenticating a customer via mobile number & MSG91 OTP.
 * Intelligently handles multiple accounts sharing the same mobile number.
 */

import crypto from 'crypto';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { LoginPhoneRequestDTO, LoginPhoneResponseDTO } from '../dtos/login-phone.dto';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';
import { msg91OtpService } from '../../infrastructure/services/msg91-otp.service';
import { ApiError } from '@shared/utils/api-error.util';

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

    // SEC-HIGH-006: Phone OTP Authentication of Privileged Accounts.
    // Storefront mobile OTP is strictly for CUSTOMER accounts.
    // Administrative and staff accounts must log in via the Admin Portal using work email and password.
    const customerAccounts: User[] = [];
    let hasPrivilegedAccount = false;

    for (const u of activeUsers) {
      let isPrivileged = false;
      if (u.roleId) {
        try {
          const userRole = await this.roleRepository.findById(u.roleId);
          if (
            userRole &&
            (userRole.name.toUpperCase() !== 'CUSTOMER' ||
              userRole.level > 0 ||
              userRole.permissions.includes('*'))
          ) {
            isPrivileged = true;
          }
        } catch {
          // fallback
        }
      }

      if (isPrivileged) {
        hasPrivilegedAccount = true;
      } else {
        customerAccounts.push(u);
      }
    }

    if (activeUsers.length > 0 && customerAccounts.length === 0 && hasPrivilegedAccount) {
      throw ApiError.forbidden(
        'Administrative and staff accounts cannot authenticate via storefront mobile OTP. Please sign in via the Admin Portal using your work email and password.'
      );
    }

    let user: User;

    if (customerAccounts.length === 0) {
      // Modern D2C Auto-Registration on first phone OTP verification:
      // If customer doesn't exist yet, automatically create their account
      const customerRole = await this.roleRepository.findByName('CUSTOMER');
      const roleId = customerRole ? customerRole.id : 'CUSTOMER_ROLE_ID';

      const newUser = await User.create({
        fullName: 'Customer',
        phone: rawPhone,
        email: null,
        password: crypto.randomUUID(),
        roleId,
        isPhoneVerified: true,
      });

      user = await this.userRepository.create(newUser);
    } else if (customerAccounts.length > 1) {
      // If multiple customer accounts found, prompt user to select which account to access
      const selectionToken = signAccessToken({
        phone: rawPhone,
        purpose: 'phone_account_selection',
        candidateIds: customerAccounts.map((u) => u.id),
      });

      return {
        multipleAccounts: true,
        selectionToken,
        accounts: customerAccounts.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email && !u.email.endsWith('@user.yox.internal') ? u.email : null,
          maskedEmail: maskEmail(u.email),
          createdAt: u.createdAt,
        })),
      };
    } else {
      user = customerAccounts[0];
    }

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.roleId,
      tokenVersion: user.tokenVersion ?? 0,
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

/**
 * @file register.use-case.ts
 * @layer Application › Use Cases
 * 
 * Handles the business logic for registering a new user.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ConflictError, NotFoundError } from '@core/application/errors/application.error';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { RegisterUserRequestDTO, RegisterUserResponseDTO } from '../dtos/register.dto';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { msg91OtpService } from '../../infrastructure/services/msg91-otp.service';

export class RegisterUserUseCase implements IUseCase<RegisterUserRequestDTO, RegisterUserResponseDTO> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  async execute(input: RegisterUserRequestDTO): Promise<RegisterUserResponseDTO> {
    const rawEmail = input.email ? input.email.trim().toLowerCase() : null;
    const rawPhone = input.phone ? input.phone.trim() : null;

    // 1. Check if email is provided and already taken
    if (rawEmail) {
      const exists = await this.userRepository.existsByEmail(rawEmail);
      if (exists) {
        throw new ConflictError(`User with email ${rawEmail} already exists`);
      }
    }

    // 1.1 If verificationToken is provided, verify with MSG91
    let isPhoneVerified = false;
    if (input.verificationToken && rawPhone) {
      await msg91OtpService.verifyToken(input.verificationToken, rawPhone);
      isPhoneVerified = true;
    }

    // 1.2 Resolve unique email handle if not provided
    let resolvedEmail = rawEmail;
    if (!resolvedEmail && rawPhone) {
      const cleanDigits = rawPhone.replace(/\D/g, '');
      const existing = await this.userRepository.findAllByPhone(rawPhone);
      resolvedEmail =
        existing.length > 0
          ? `${cleanDigits}_${existing.length + 1}@user.yox.internal`
          : `${cleanDigits}@user.yox.internal`;
    }

    // 1.5 Get default Customer role
    const customerRole = await this.roleRepository.findByName('CUSTOMER');
    if (!customerRole) {
      throw new NotFoundError('Default customer role not found in the system');
    }

    // 2. Create Domain Entity
    const userEntity = await User.create({
      fullName: input.fullName.trim(),
      email: resolvedEmail,
      password: input.password,
      phone: rawPhone,
      isPhoneVerified,
      roleId: customerRole.id,
    });

    // 3. Persist to Database
    const savedUser = await this.userRepository.create(userEntity);

    // 🔔 Real-time staff notification for new user registration
    try {
      await NotificationService.getInstance().notify({
        userId: null,
        type: 'NEW_USER',
        title: '👤 New Customer Registered!',
        message: `${savedUser.fullName} (${savedUser.email || savedUser.phone || 'New Customer'}) just created an account.`,
        metadata: {
          userId: savedUser.id,
          fullName: savedUser.fullName,
          email: savedUser.email || undefined,
          phone: savedUser.phone || undefined,
        },
      });
    } catch {
      // Notification failure should not block user registration
    }

    // 4. Generate auth tokens
    const tokenPayload = {
      sub: savedUser.id,
      email: savedUser.email || '',
      role: savedUser.roleId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // 5. Return safe DTO with user object and tokens
    return {
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email ?? null,
        roleId: savedUser.roleId,
        permissions: customerRole.permissions || [],
        phone: savedUser.phone ?? undefined,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}

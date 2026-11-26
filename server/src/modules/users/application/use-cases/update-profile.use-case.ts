/**
 * @file update-profile.use-case.ts
 * @layer Application › Use Cases
 *
 * Use Case to update a user's own profile.
 * Validates email uniqueness and requires MSG91 OTP verification for phone number changes.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { UpdateProfileRequestDTO } from '../dtos/update-profile.dto';
import { User } from '../../domain/entities/user.entity';
import { msg91OtpService } from '../../../auth/infrastructure/services/msg91-otp.service';
import { RoleModel } from '../../../roles/infrastructure/models/role.model';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository?: IRoleRepository
  ) {}

  public async execute(userId: string, data: UpdateProfileRequestDTO): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    // Security Rule 1: The primary System Administrator registered phone number CANNOT be changed via
    // generic profile update. Multi-factor dual-OTP verification (password confirmation + current phone OTP +
    // new phone OTP) is strictly required via the dedicated Admin Phone Change workflow.
    const isOwner = user.email === 'admin@yox.com';
    if (isOwner && data.phone !== undefined) {
      throw ApiError.forbidden(
        'The primary System Administrator registered phone number cannot be modified via standard profile update. Please use the secure Administrator Phone Change workflow requiring password re-authentication and dual-OTP verification.'
      );
    }

    // Security Rule 2: Internal staff members, managers, and editors cannot change their assigned contact phone or work email.
    // Only standard storefront Customers may update their personal contact phone via this endpoint.
    if (!isOwner && user.roleId && (data.email !== undefined || data.phone !== undefined)) {
      let roleName = '';
      if (this.roleRepository) {
        const roleEntity = await this.roleRepository.findById(user.roleId);
        roleName = roleEntity?.name || '';
      } else {
        try {
          const roleDoc = await RoleModel.findById(user.roleId).select('name').lean();
          roleName = roleDoc?.name || '';
        } catch {}
      }

      if (
        roleName &&
        roleName.toUpperCase() !== 'CUSTOMER'
      ) {
        throw ApiError.forbidden(
          'Staff members cannot change their assigned work email or contact phone number. Please contact your store administrator.'
        );
      }
    }

    let resolvedEmail: string | null | undefined = user.email;
    let isEmailVerified = user.isEmailVerified;

    // 1. If email is being changed, check uniqueness or clear it
    if (data.email !== undefined) {
      const normalizedNewEmail = data.email ? data.email.trim().toLowerCase() : '';
      const currentEmail = user.email && !user.email.endsWith('@user.yox.internal')
        ? user.email.toLowerCase().trim()
        : '';

      if (normalizedNewEmail) {
        if (normalizedNewEmail !== currentEmail) {
          // Basic email syntax check
          if (!/^\S+@\S+\.\S+$/.test(normalizedNewEmail)) {
            throw ApiError.badRequest('Please provide a valid email address');
          }

          const existingUser = await this.userRepository.findByEmail(normalizedNewEmail);
          if (existingUser && existingUser.id !== userId) {
            throw ApiError.conflict('This email address is already in use by another account');
          }

          resolvedEmail = normalizedNewEmail;
          isEmailVerified = false;
        }
      } else {
        // User is clearing their email address
        resolvedEmail = null;
        isEmailVerified = false;
      }
    }

    // 2. If phone number is being changed, require and verify mobile OTP
    let isPhoneVerified = user.isPhoneVerified;
    let resolvedPhone = user.phone;

    if (data.phone !== undefined) {
      const cleanNewPhone = data.phone.trim();
      const currentPhone = user.phone ? user.phone.trim() : '';

      const normNew = cleanNewPhone.replace(/\D/g, '');
      const normCurrent = currentPhone.replace(/\D/g, '');
      const canonicalNew = normNew.length === 10 ? `91${normNew}` : normNew;
      const canonicalCurrent = normCurrent.length === 10 ? `91${normCurrent}` : normCurrent;

      if (cleanNewPhone && canonicalNew !== canonicalCurrent) {
        // Enforce phone number uniqueness across all accounts
        const existingUserWithPhone = await this.userRepository.findByPhone(cleanNewPhone);
        if (existingUserWithPhone && existingUserWithPhone.id !== userId) {
          throw ApiError.conflict('This mobile phone number is already registered to another account.');
        }

        // Phone number changed: OTP verification token is mandatory
        if (!data.verificationToken || !data.verificationToken.trim()) {
          throw ApiError.badRequest('Mobile verification code is required to change your phone number');
        }

        // Verify with MSG91 OTP widget service
        await msg91OtpService.verifyToken(data.verificationToken, cleanNewPhone);
        isPhoneVerified = true;
        resolvedPhone = cleanNewPhone;
      } else if (!cleanNewPhone && currentPhone) {
        // User is unlinking their phone
        resolvedPhone = null;
        isPhoneVerified = false;
      }
    }

    const resolvedFullName =
      data.fullName !== undefined
        ? (data.fullName.trim() || user.fullName || 'Customer')
        : user.fullName;

    const oldPhone = user.phone;

    // 3. Update User Entity
    user.updateProfile({
      fullName: resolvedFullName,
      email: resolvedEmail,
      phone: resolvedPhone !== undefined ? (resolvedPhone || null) : undefined,
      profileImage: data.profileImage,
      isPhoneVerified,
      isEmailVerified,
    });

    const updatedUser = await this.userRepository.update(userId, user);
    
    if (!updatedUser) {
      throw ApiError.internal('Failed to update user profile');
    }

    // Record security audit log on phone number replacement (without logging full raw phone numbers)
    if (data.phone !== undefined && resolvedPhone !== oldPhone) {
      const auditService = AuditLogService.getInstance();
      if (auditService) {
        const mask = (p: string | null | undefined) => {
          if (!p) return 'None';
          const s = String(p);
          return s.length > 4 ? `${s.slice(0, 2)}****${s.slice(-2)}` : '****';
        };
        auditService.record({
          actorId: userId,
          actorEmail: user.email,
          action: 'USER_PHONE_CHANGED',
          resourceType: 'User',
          resourceId: userId,
          description: `User phone changed from ${mask(oldPhone)} to ${mask(resolvedPhone)}`,
          before: { phone: mask(oldPhone) },
          after: { phone: mask(resolvedPhone) },
        }).catch(() => {});
      }
    }

    return updatedUser;
  }
}

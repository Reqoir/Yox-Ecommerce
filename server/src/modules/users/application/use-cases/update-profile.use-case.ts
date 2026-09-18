/**
 * @file update-profile.use-case.ts
 * @layer Application › Use Cases
 *
 * Use Case to update a user's own profile.
 * Validates email uniqueness and requires MSG91 OTP verification for phone number changes.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UpdateProfileRequestDTO } from '../dtos/update-profile.dto';
import { User } from '../../domain/entities/user.entity';
import { msg91OtpService } from '../../../auth/infrastructure/services/msg91-otp.service';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string, data: UpdateProfileRequestDTO): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    let resolvedEmail = user.email;

    // 1. If email is being changed, check if it is already taken by another account
    if (data.email !== undefined) {
      const normalizedNewEmail = data.email.trim().toLowerCase();
      const currentEmail = user.email ? user.email.toLowerCase().trim() : '';

      if (normalizedNewEmail && normalizedNewEmail !== currentEmail) {
        // Basic email syntax check
        if (!/^\S+@\S+\.\S+$/.test(normalizedNewEmail)) {
          throw ApiError.badRequest('Please provide a valid email address');
        }

        const existingUser = await this.userRepository.findByEmail(normalizedNewEmail);
        if (existingUser && existingUser.id !== userId) {
          throw ApiError.conflict('This email address is already in use by another account');
        }

        resolvedEmail = normalizedNewEmail;
      }
    }

    // 2. If phone number is being changed, require and verify mobile OTP
    let isPhoneVerified = user.isPhoneVerified;
    let resolvedPhone = user.phone;

    if (data.phone !== undefined) {
      const cleanNewPhone = data.phone.trim();
      const currentPhone = user.phone ? user.phone.trim() : '';

      const last10New = cleanNewPhone.replace(/\D/g, '').slice(-10);
      const last10Current = currentPhone.replace(/\D/g, '').slice(-10);

      if (cleanNewPhone && last10New !== last10Current) {
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

    // 3. Update User Entity
    user.updateProfile({
      fullName: data.fullName !== undefined ? data.fullName.trim() : undefined,
      email: resolvedEmail,
      phone: resolvedPhone !== undefined ? (resolvedPhone || null) : undefined,
      profileImage: data.profileImage,
      isPhoneVerified,
    });

    const updatedUser = await this.userRepository.update(userId, user);
    
    if (!updatedUser) {
      throw ApiError.internal('Failed to update user profile');
    }

    return updatedUser;
  }
}

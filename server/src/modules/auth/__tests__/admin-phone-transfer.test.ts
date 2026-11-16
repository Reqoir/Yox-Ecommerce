/**
 * @file admin-phone-transfer.test.ts
 * @description Automated Unit & Integration Tests for Administrator Phone Transfer, Uniqueness, Storefront OTP and User Cleanup.
 */

import { User, UserStatus } from '../../users/domain/entities/user.entity';
import { IUserRepository } from '../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../roles/domain/repositories/role.repository.interface';
import { UpdateProfileUseCase } from '../../users/application/use-cases/update-profile.use-case';
import { LoginPhoneUseCase } from '../application/use-cases/login-phone.use-case';
import { msg91OtpService } from '../infrastructure/services/msg91-otp.service';
import { ApiError } from '@shared/utils/api-error.util';
import { Role } from '../../roles/domain/entities/role.entity';

describe('Admin Phone Transfer, OTP Registration & User Cleanup Test Suite', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockRoleRepo: jest.Mocked<IRoleRepository>;

  const ADMIN_ID = '6aeddbffc5b528381f3a8c00';
  const OLD_PHONE = '7594830618';
  const NEW_PHONE = '8089399521';
  const ADMIN_ROLE_ID = '6aeddbfec5b528381f3a8bfd';
  const CUSTOMER_ROLE_ID = '6aeddbfddb84c375530da43c';

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findAllByPhone: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsByPhone: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    mockRoleRepo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IRoleRepository>;

    jest.clearAllMocks();
  });

  describe('1. Admin Phone Number Replacement Flow', () => {
    it('should preserve existing administrator ID, email, role, and password when phone is replaced', async () => {
      const adminUser = User.reconstitute({
        id: ADMIN_ID,
        fullName: 'System Admin',
        email: 'admin@yox.com',
        phone: OLD_PHONE,
        password: '$2a$12$hashedPasswordVal',
        roleId: ADMIN_ROLE_ID,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.findByPhone.mockResolvedValue(null); // New phone is not owned by anyone else
      mockUserRepo.update.mockImplementation(async (_id, user) => user as User);

      // Mock successful MSG91 verification
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValue({ verified: true, identifier: NEW_PHONE });

      const updateProfileUseCase = new UpdateProfileUseCase(mockUserRepo);
      const updated = await updateProfileUseCase.execute(ADMIN_ID, {
        phone: NEW_PHONE,
        verificationToken: 'valid_msg91_token_new_phone',
      });

      // Verify administrator preserves ID, email, role
      expect(updated.id).toBe(ADMIN_ID);
      expect(updated.email).toBe('admin@yox.com');
      expect(updated.roleId).toBe(ADMIN_ROLE_ID);
      expect(updated.phone).toBe(NEW_PHONE);
      expect(updated.isPhoneVerified).toBe(true);

      expect(msg91OtpService.verifyToken).toHaveBeenCalledWith('valid_msg91_token_new_phone', NEW_PHONE);
      expect(mockUserRepo.update).toHaveBeenCalledWith(ADMIN_ID, expect.any(User));
    });

    it('should reject phone update if MSG91 OTP verification fails, leaving old phone intact', async () => {
      const adminUser = User.reconstitute({
        id: ADMIN_ID,
        fullName: 'System Admin',
        email: 'admin@yox.com',
        phone: OLD_PHONE,
        password: '$2a$12$hashedPasswordVal',
        roleId: ADMIN_ROLE_ID,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.findByPhone.mockResolvedValue(null);

      // Mock MSG91 failure
      jest.spyOn(msg91OtpService, 'verifyToken').mockRejectedValue(
        ApiError.unauthorized('Mobile OTP verification token is invalid or expired.')
      );

      const updateProfileUseCase = new UpdateProfileUseCase(mockUserRepo);

      await expect(
        updateProfileUseCase.execute(ADMIN_ID, {
          phone: NEW_PHONE,
          verificationToken: 'invalid_token',
        })
      ).rejects.toThrow(ApiError);

      // Verify update was never called
      expect(mockUserRepo.update).not.toHaveBeenCalled();
      expect(adminUser.phone).toBe(OLD_PHONE);
    });

    it('should reject phone update if new phone is already registered to another account (uniqueness check)', async () => {
      const adminUser = User.reconstitute({
        id: ADMIN_ID,
        fullName: 'System Admin',
        email: 'admin@yox.com',
        phone: OLD_PHONE,
        password: '$2a$12$hashedPasswordVal',
        roleId: ADMIN_ROLE_ID,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const conflictingUser = User.reconstitute({
        id: 'user_other_999',
        fullName: 'Other User',
        email: 'other@yox.com',
        phone: NEW_PHONE,
        password: '$2a$12$hashedPasswordVal',
        roleId: CUSTOMER_ROLE_ID,
        isEmailVerified: false,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.findByPhone.mockResolvedValue(conflictingUser);

      const updateProfileUseCase = new UpdateProfileUseCase(mockUserRepo);

      await expect(
        updateProfileUseCase.execute(ADMIN_ID, {
          phone: NEW_PHONE,
          verificationToken: 'valid_token',
        })
      ).rejects.toThrow(ApiError);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('2. Storefront OTP & Released Old Phone Availability', () => {
    it('should block the new administrator phone from authenticating into a privileged session via storefront OTP (SEC-HIGH-006)', async () => {
      const adminUser = User.reconstitute({
        id: ADMIN_ID,
        fullName: 'System Admin',
        email: 'admin@yox.com',
        phone: NEW_PHONE, // admin now owns 8089399521
        password: '$2a$12$hashedPasswordVal',
        roleId: ADMIN_ROLE_ID,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const adminRole = Role.reconstitute({
        id: ADMIN_ROLE_ID,
        name: 'ADMIN',
        level: 100,
        permissions: ['*'],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepo.findAllByPhone.mockResolvedValue([adminUser]);
      mockRoleRepo.findById.mockResolvedValue(adminRole);
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValue({ verified: true, identifier: NEW_PHONE });

      const loginPhoneUseCase = new LoginPhoneUseCase(mockUserRepo, mockRoleRepo);

      await expect(
        loginPhoneUseCase.execute({
          phone: NEW_PHONE,
          verificationToken: 'valid_otp_token',
        })
      ).rejects.toThrow(
        'Administrative and staff accounts cannot authenticate via storefront mobile OTP. Please sign in via the Admin Portal using your work email and password.'
      );
    });

    it('should allow the released old phone number (7594830618) to auto-register a brand new CUSTOMER account', async () => {
      // Old phone is now unlinked: findAllByPhone returns empty array
      mockUserRepo.findAllByPhone.mockResolvedValue([]);

      const customerRole = Role.reconstitute({
        id: CUSTOMER_ROLE_ID,
        name: 'CUSTOMER',
        level: 0,
        permissions: [],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRoleRepo.findByName.mockResolvedValue(customerRole);
      mockRoleRepo.findById.mockResolvedValue(customerRole);
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValue({ verified: true, identifier: OLD_PHONE });

      const createdCustomer = User.reconstitute({
        id: 'customer_new_12345',
        fullName: 'Customer',
        email: '',
        phone: OLD_PHONE,
        password: '$2a$12$randomPasswordHash',
        roleId: CUSTOMER_ROLE_ID,
        isEmailVerified: false,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepo.create.mockResolvedValue(createdCustomer);

      const loginPhoneUseCase = new LoginPhoneUseCase(mockUserRepo, mockRoleRepo);
      const response = await loginPhoneUseCase.execute({
        phone: OLD_PHONE,
        verificationToken: 'valid_otp_token',
      });

      // Customer session created
      expect(response.multipleAccounts).toBe(false);
      if (!response.multipleAccounts) {
        expect(response.user.id).toBe('customer_new_12345');
        expect(response.user.id).not.toBe(ADMIN_ID); // Completely separate user ID
        expect(response.user.role).toBe('CUSTOMER'); // Customer role
        expect(response.user.permissions).toEqual([]); // No administrative permissions
        expect(response.accessToken).toBeDefined();
        expect(response.refreshToken).toBeDefined();
      }

      expect(mockUserRepo.create).toHaveBeenCalledWith(expect.any(User));
    });
  });
});

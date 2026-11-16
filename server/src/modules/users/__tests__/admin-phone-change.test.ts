/**
 * @file admin-phone-change.test.ts
 * @description Comprehensive automated unit tests for Administrator Mobile Number Change Security Enhancement.
 * 
 * Verifies all 11+ required test cases:
 *  1. Existing-number OTP is required.
 *  2. New-number OTP is required.
 *  3. Wrong or expired OTP is rejected.
 *  4. Staff cannot change the primary administrator's number.
 *  5. Managers and Editors cannot change it.
 *  6. Unauthenticated requests are rejected.
 *  7. Replayed OTPs are rejected.
 *  8. Duplicate phone numbers are rejected.
 *  9. Failed verification never changes the database.
 * 10. Successful verification updates the number and releases the old one.
 * 11. Concurrent change requests cannot overwrite each other.
 * 12. Password confirmation is required and validated before initiation.
 * 13. Direct phone change via generic profile update (PATCH /users/me) is blocked for primary admin.
 * 14. Maximum attempt limit (3 failed OTP attempts) terminates the session.
 * 15. Resend cooldown (30s) is enforced.
 * 16. Existing phone unavailable directs to offline recovery and forbids online bypass.
 */

import { User, UserStatus } from '../domain/entities/user.entity';
import { IUserRepository } from '../domain/repositories/user.repository.interface';
import { AdminPhoneChangeUseCase, PRIMARY_ADMIN_EMAIL } from '../application/use-cases/admin-phone-change.use-case';
import { adminPhoneChangeSessionStore } from '../application/services/admin-phone-change-session.store';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';
import { msg91OtpService } from '../../auth/infrastructure/services/msg91-otp.service';
import { hashPassword } from '@shared/utils/password.helper';
import { ApiError } from '@shared/utils/api-error.util';
import { ValidationError } from '@core/application/errors/application.error';

describe('Admin Mobile Number Change Security Enhancement Test Suite', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let useCase: AdminPhoneChangeUseCase;
  let updateProfileUseCase: UpdateProfileUseCase;

  const ADMIN_ID = '6aeddbffc5b528381f3a8c00';
  const CURRENT_PHONE = '8089399521';
  const NEW_PHONE = '7594830618';
  const THIRD_PHONE = '9876543210';
  const ADMIN_PASSWORD = 'CorrectAdminPassword123!';
  let adminHashedPassword = '';

  let adminUser: User;

  beforeAll(async () => {
    adminHashedPassword = await hashPassword(ADMIN_PASSWORD);
  });

  beforeEach(() => {
    adminPhoneChangeSessionStore.clearAll();

    adminUser = User.reconstitute({
      id: ADMIN_ID,
      fullName: 'System Administrator',
      email: PRIMARY_ADMIN_EMAIL,
      password: adminHashedPassword,
      phone: CURRENT_PHONE,
      roleId: '6aeddbfec5b528381f3a8bfd',
      isEmailVerified: true,
      isPhoneVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-11-01'),
      updatedAt: new Date('2026-11-16'),
    });

    mockUserRepo = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === ADMIN_ID) return Promise.resolve(adminUser);
        return Promise.resolve(null);
      }),
      findByEmail: jest.fn().mockImplementation((email: string) => {
        if (email.toLowerCase() === PRIMARY_ADMIN_EMAIL) return Promise.resolve(adminUser);
        return Promise.resolve(null);
      }),
      findByPhone: jest.fn().mockImplementation((phone: string) => {
        const clean = phone.replace(/\D/g, '');
        if (clean === CURRENT_PHONE || clean === `91${CURRENT_PHONE}`) return Promise.resolve(adminUser);
        return Promise.resolve(null);
      }),
      findAllByPhone: jest.fn().mockResolvedValue([]),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn().mockImplementation((_id: string, user: User) => Promise.resolve(user)),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsByPhone: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    useCase = new AdminPhoneChangeUseCase(mockUserRepo, adminPhoneChangeSessionStore);
    updateProfileUseCase = new UpdateProfileUseCase(mockUserRepo);

    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. PASSWORD CONFIRMATION & INITIATION TESTS
  // =========================================================================
  describe('Stage 1: Password Confirmation & Initiation', () => {
    it('1. Requires password confirmation before initiating phone change', async () => {
      await expect(
        useCase.initiate({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          password: '',
        })
      ).rejects.toThrow(ApiError);
    });

    it('2. Rejects wrong administrator password', async () => {
      await expect(
        useCase.initiate({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          password: 'WrongPassword!',
        })
      ).rejects.toThrow('Invalid administrator password');
    });

    it('3. Successfully initiates with correct password and returns current phone OTP step', async () => {
      const res = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      expect(res.sessionId).toBeDefined();
      expect(res.step).toBe('VERIFY_CURRENT_PHONE');
      expect(res.maskedCurrentPhone).toBe('80****21');
    });

    it('4. Rejects initiation if administrator account has no currently registered phone', async () => {
      const adminWithoutPhone = User.reconstitute({
        id: ADMIN_ID,
        fullName: 'Admin',
        email: PRIMARY_ADMIN_EMAIL,
        password: adminHashedPassword,
        phone: null,
        roleId: 'role1',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUserRepo.findById.mockResolvedValueOnce(adminWithoutPhone);

      await expect(
        useCase.initiate({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('No currently registered mobile phone number was found');
    });
  });

  // =========================================================================
  // 2. RBAC & ACTOR RESTRICTIONS
  // =========================================================================
  describe('RBAC & Privilege Protection', () => {
    it('5. Staff cannot initiate or change the primary administrator number', async () => {
      const staffActor = { id: 'staff_user_1', email: 'staff@yox.com' };
      await expect(
        useCase.initiate({
          actor: staffActor,
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('Only the primary System Administrator');
    });

    it('6. Managers and Editors cannot initiate or change the primary administrator number', async () => {
      const managerActor = { id: 'manager_user_1', email: 'manager@yox.com' };
      const editorActor = { id: 'editor_user_1', email: 'editor@yox.com' };

      await expect(
        useCase.initiate({
          actor: managerActor,
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('Only the primary System Administrator');

      await expect(
        useCase.initiate({
          actor: editorActor,
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('Only the primary System Administrator');
    });

    it('7. Unauthenticated requests are rejected', async () => {
      await expect(
        useCase.initiate({
          actor: { id: '', email: '' },
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow(ApiError);
    });

    it('8. Direct phone change on primary admin via generic profile update (PATCH /users/me) is BLOCKED', async () => {
      await expect(
        updateProfileUseCase.execute(ADMIN_ID, {
          phone: NEW_PHONE,
          verificationToken: 'dummy_token',
        })
      ).rejects.toThrow('The primary System Administrator registered phone number cannot be modified via standard profile update');
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. EXISTING-NUMBER OTP VERIFICATION
  // =========================================================================
  describe('Stage 2: Existing-Number OTP Verification', () => {
    it('9. Existing-number OTP is strictly required before entering new number', async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      // Attempting to jump directly to requestNewPhone without verifying current phone
      await expect(
        useCase.requestNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          newPhone: NEW_PHONE,
        })
      ).rejects.toThrow('Verification of your current registered mobile number is required');
    });

    it('10. Wrong or expired OTP on existing number is rejected and fails closed', async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      jest.spyOn(msg91OtpService, 'verifyToken').mockRejectedValueOnce(
        new ValidationError('Invalid verification code')
      );

      await expect(
        useCase.verifyCurrentPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          verificationToken: 'WRONG_OTP_TOKEN',
        })
      ).rejects.toThrow('Invalid verification code');

      // Database must NOT be updated
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('11. Successful verification of current phone advances state to ENTER_NEW_PHONE', async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: CURRENT_PHONE,
      });

      const verifyRes = await useCase.verifyCurrentPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: initRes.sessionId,
        verificationToken: 'VALID_CURRENT_TOKEN',
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.step).toBe('ENTER_NEW_PHONE');
    });
  });

  // =========================================================================
  // 4. NEW-NUMBER VALIDATION & COOLDOWN
  // =========================================================================
  describe('Stage 3: New-Number Specification', () => {
    let activeSessionId: string;

    beforeEach(async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });
      activeSessionId = initRes.sessionId;

      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: CURRENT_PHONE,
      });

      await useCase.verifyCurrentPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        verificationToken: 'VALID_CURRENT_TOKEN',
      });
    });

    it('12. Rejects new phone if identical to current phone', async () => {
      await expect(
        useCase.requestNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: activeSessionId,
          newPhone: CURRENT_PHONE,
        })
      ).rejects.toThrow('New mobile number must be different from your current registered phone number');
    });

    it('13. Rejects duplicate phone number registered to another user account', async () => {
      const existingCustomer = User.reconstitute({
        id: 'customer_999',
        fullName: 'Other User',
        email: 'other@example.com',
        password: 'hash',
        phone: NEW_PHONE,
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUserRepo.findByPhone.mockResolvedValueOnce(existingCustomer);

      await expect(
        useCase.requestNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: activeSessionId,
          newPhone: NEW_PHONE,
        })
      ).rejects.toThrow('This mobile phone number is already registered to another account');
    });

    it('14. Accepts valid unique new phone and returns VERIFY_NEW_PHONE step', async () => {
      // Simulate that cooldown passed
      const session = await adminPhoneChangeSessionStore.getSession(activeSessionId);
      if (session) {
        session.lastOtpSentAt = Date.now() - 35000; // 35s ago
        await adminPhoneChangeSessionStore.updateSession(session);
      }

      const res = await useCase.requestNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        newPhone: NEW_PHONE,
      });

      expect(res.success).toBe(true);
      expect(res.step).toBe('VERIFY_NEW_PHONE');
      expect(res.maskedNewPhone).toBe('75****18');
    });

    it('15. Enforces resend cooldown between rapid OTP requests', async () => {
      // First request (cooldown reset)
      const session = await adminPhoneChangeSessionStore.getSession(activeSessionId);
      if (session) {
        session.lastOtpSentAt = Date.now() - 35000;
        await adminPhoneChangeSessionStore.updateSession(session);
      }

      await useCase.requestNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        newPhone: NEW_PHONE,
      });

      // Immediate second request within 30s
      await expect(
        useCase.requestNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: activeSessionId,
          newPhone: THIRD_PHONE,
        })
      ).rejects.toThrow('Please wait');
    });
  });

  // =========================================================================
  // 5. NEW-NUMBER OTP VERIFICATION & DATABASE COMMIT
  // =========================================================================
  describe('Stage 4: New-Number OTP Verification & Atomic Database Commit', () => {
    let activeSessionId: string;

    beforeEach(async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });
      activeSessionId = initRes.sessionId;

      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: CURRENT_PHONE,
      });

      await useCase.verifyCurrentPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        verificationToken: 'VALID_CURRENT_TOKEN',
      });

      const session = await adminPhoneChangeSessionStore.getSession(activeSessionId);
      if (session) {
        session.lastOtpSentAt = Date.now() - 35000;
        await adminPhoneChangeSessionStore.updateSession(session);
      }

      await useCase.requestNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        newPhone: NEW_PHONE,
      });
    });

    it('16. New-number OTP is strictly required', async () => {
      await expect(
        useCase.verifyNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: activeSessionId,
          verificationToken: '',
        })
      ).rejects.toThrow('Verification code is required');
    });

    it('17. Wrong or expired OTP on new phone is rejected and NEVER updates database', async () => {
      jest.spyOn(msg91OtpService, 'verifyToken').mockRejectedValueOnce(
        new ValidationError('Invalid mobile verification code')
      );

      await expect(
        useCase.verifyNewPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: activeSessionId,
          verificationToken: 'WRONG_NEW_TOKEN',
        })
      ).rejects.toThrow('Invalid mobile verification code');

      // Database must remain completely unchanged
      expect(mockUserRepo.update).not.toHaveBeenCalled();
      expect(adminUser.phone).toBe(CURRENT_PHONE);
    });

    it('18. Replayed OTP token is rejected', async () => {
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: NEW_PHONE,
      });

      // First successful use
      await useCase.verifyNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        verificationToken: 'SINGLE_USE_TOKEN_XYZ',
      });

      // Second use of same token: must be rejected
      const tokenNotReplayed = await adminPhoneChangeSessionStore.consumeToken('SINGLE_USE_TOKEN_XYZ');
      expect(tokenNotReplayed).toBe(false);
    });

    it('19. Successful dual verification updates admin phone and releases old number', async () => {
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: NEW_PHONE,
      });

      const res = await useCase.verifyNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: activeSessionId,
        verificationToken: 'VALID_NEW_TOKEN',
      });

      expect(res.success).toBe(true);
      expect(res.phone).toBe(NEW_PHONE);

      // Verify userRepository.update was called with updated phone
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
      const updatedEntity = mockUserRepo.update.mock.calls[0][1];
      expect(updatedEntity.phone).toBe(NEW_PHONE);
      expect(updatedEntity.isPhoneVerified).toBe(true);

      // Session must be destroyed after completion
      const sessionAfter = await adminPhoneChangeSessionStore.getSession(activeSessionId);
      expect(sessionAfter).toBeNull();
    });
  });

  // =========================================================================
  // 6. CONCURRENCY & ATTRIBUTE SECURITY
  // =========================================================================
  describe('Concurrency & Session Limits', () => {
    it('20. Concurrent phone-number change requests cannot overwrite each other', async () => {
      // First session initiates successfully
      const firstRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });
      expect(firstRes.sessionId).toBeDefined();

      // Second concurrent session initiation for the same admin must be rejected
      await expect(
        useCase.initiate({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('A phone number change session is already active');
    });

    it('21. Exceeding max failed OTP attempts (3) terminates the session', async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      jest.spyOn(msg91OtpService, 'verifyToken').mockRejectedValue(
        new ValidationError('Invalid code')
      );

      // Attempt 1
      await expect(
        useCase.verifyCurrentPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          verificationToken: 'FAIL_1',
        })
      ).rejects.toThrow();

      // Attempt 2
      await expect(
        useCase.verifyCurrentPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          verificationToken: 'FAIL_2',
        })
      ).rejects.toThrow();

      // Attempt 3
      await expect(
        useCase.verifyCurrentPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          verificationToken: 'FAIL_3',
        })
      ).rejects.toThrow();

      // Attempt 4: session is terminated
      await expect(
        useCase.verifyCurrentPhone({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          sessionId: initRes.sessionId,
          verificationToken: 'FAIL_4',
        })
      ).rejects.toThrow('Too many failed verification attempts');
    });

    it('22. Account recovery info endpoint confirms that automated bypass is prohibited', () => {
      const info = useCase.getRecoveryInfo();
      expect(info.allowed).toBe(false);
      expect(info.policy).toContain('Automated bypass of existing-number verification is strictly prohibited');
    });

    it('23. Enforces strict fail-closed policy when Redis is unavailable in cluster mode', async () => {
      adminPhoneChangeSessionStore.setForceFailClosed(true);

      await expect(
        useCase.initiate({
          actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
          password: ADMIN_PASSWORD,
        })
      ).rejects.toThrow('Distributed session cache (Redis) is unavailable. For PM2 cluster safety, operation aborted.');

      adminPhoneChangeSessionStore.setForceFailClosed(false);
    });

    it('24. Safe lock release prevents mismatched sessionId from releasing an active lock', async () => {
      const lockAcquired = await adminPhoneChangeSessionStore.acquireLock(ADMIN_ID, 'VALID_SESSION_123');
      expect(lockAcquired).toBe(true);

      // Attempt to release with a different session ID: should NOT release lock
      await adminPhoneChangeSessionStore.releaseLock(ADMIN_ID, 'WRONG_SESSION_999');

      // Attempt to acquire lock again should fail because VALID_SESSION_123 still holds it
      const secondAcquire = await adminPhoneChangeSessionStore.acquireLock(ADMIN_ID, 'ANOTHER_SESSION_456');
      expect(secondAcquire).toBe(false);

      // Release with correct sessionId should succeed
      await adminPhoneChangeSessionStore.releaseLock(ADMIN_ID, 'VALID_SESSION_123');
      const thirdAcquire = await adminPhoneChangeSessionStore.acquireLock(ADMIN_ID, 'ANOTHER_SESSION_456');
      expect(thirdAcquire).toBe(true);
    });

    it('25. Explicit cancellation releases concurrency lock and destroys session', async () => {
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      // Session exists
      const session = await adminPhoneChangeSessionStore.getSession(initRes.sessionId);
      expect(session).not.toBeNull();

      // Cancel session
      const cancelRes = await useCase.cancel({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: initRes.sessionId,
      });
      expect(cancelRes.success).toBe(true);

      // Session destroyed
      const sessionAfter = await adminPhoneChangeSessionStore.getSession(initRes.sessionId);
      expect(sessionAfter).toBeNull();

      // New initiation immediately succeeds (lock was released)
      const newInitRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });
      expect(newInitRes.sessionId).toBeDefined();
    });

    it('26. Successful phone change increments tokenVersion and returns fresh JWT credentials', async () => {
      const initialTokenVersion = adminUser.tokenVersion;

      // Initiate session
      const initRes = await useCase.initiate({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        password: ADMIN_PASSWORD,
      });

      // Verify current phone
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: CURRENT_PHONE,
      });
      await useCase.verifyCurrentPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: initRes.sessionId,
        verificationToken: 'VALID_CURRENT_TOKEN',
      });

      // Request new phone
      await useCase.requestNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: initRes.sessionId,
        newPhone: THIRD_PHONE,
      });

      // Verify new phone
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: THIRD_PHONE,
      });
      const finalRes = await useCase.verifyNewPhone({
        actor: { id: ADMIN_ID, email: PRIMARY_ADMIN_EMAIL },
        sessionId: initRes.sessionId,
        verificationToken: 'VALID_NEW_TOKEN',
      });

      expect(finalRes.success).toBe(true);
      expect(finalRes.accessToken).toBeDefined();
      expect(finalRes.refreshToken).toBeDefined();
      expect(adminUser.tokenVersion).toBe(initialTokenVersion + 1);
    });
  });
});

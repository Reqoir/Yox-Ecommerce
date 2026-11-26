/**
 * @file phase2-security.test.ts
 * @description Comprehensive Phase 2 Security Remediation Test Suite
 * Covering:
 *  - SEC-CRIT-005: Dynamic RBAC Bypass, Substring Check Removal & Permission Escalation
 *  - SEC-CRIT-006: Settings API Authorization, Public Allowlist & Zod Schema Validation
 *  - SEC-HIGH-002: MSG91 OTP Fail-Closed & Strict E.164 Country Code Matching
 *  - SEC-HIGH-003: JWT Storage in LocalStorage & SSE URL Query Token Rejection
 *  - SEC-HIGH-005: Single-Use Password Reset via Redis & Session Invalidation via tokenVersion
 *  - SEC-HIGH-006: Storefront Phone OTP Privileged Account Access Restriction
 *  - SEC-HIGH-007: Staff Role Escalation & Archived User Restoration Protection
 *  - SEC-MED-010: Strong Password Complexity Policy Enforcement
 */

import crypto from 'crypto';
import { requirePermission } from '../../../presentation/http/middleware/require-permission.middleware';
import { requireAuth } from '../../../presentation/http/middleware/require-auth.middleware';
import { UpdateRoleUseCase } from '../../roles/application/use-cases/update-role.use-case';
import { RoleController } from '../../roles/presentation/controllers/role.controller';
import { IRoleRepository } from '../../roles/domain/repositories/role.repository.interface';
import { SettingsController } from '../../settings/presentation/controllers/settings.controller';
import { storeConfigSchema } from '../../settings/presentation/validators/settings.validator';
import { msg91OtpService } from '../infrastructure/services/msg91-otp.service';
import { UpdateProfileUseCase } from '../../users/application/use-cases/update-profile.use-case';
import { User, UserStatus } from '../../users/domain/entities/user.entity';
import { IUserRepository } from '../../users/domain/repositories/user.repository.interface';
import { ForgotPasswordUseCase } from '../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { LoginPhoneUseCase } from '../application/use-cases/login-phone.use-case';
import { LoginPhoneSelectUseCase } from '../application/use-cases/login-phone-select.use-case';
import { UpdateUserRoleUseCase } from '../../users/application/use-cases/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '../../users/application/use-cases/update-user-status.use-case';
import { strongPasswordSchema } from '../../users/presentation/validators/user.validator';
import { resetPasswordSchema } from '../presentation/validators/auth.validator';
import { signAccessToken, signResetToken } from '@shared/utils/jwt.helper';
import { ValidationError } from '@core/application/errors/application.error';
import { ApiError } from '@shared/utils/api-error.util';
import { UserModel } from '../../users/infrastructure/models/user.model';
import { RoleModel } from '../../roles/infrastructure/models/role.model';
import { SettingsModel } from '../../settings/infrastructure/models/settings.model';

// In-memory mock Redis for fast, deterministic unit test verification
const mockRedisStore = new Map<string, { value: string; expiry: number }>();

jest.mock('@core/infrastructure/database/redis/client', () => ({
  getRedisClient: () => ({
    set: jest.fn(async (key: string, value: string, _mode?: string, duration?: number) => {
      mockRedisStore.set(key, { value, expiry: Date.now() + (duration ? duration * 1000 : 900000) });
      return 'OK';
    }),
    get: jest.fn(async (key: string) => {
      const entry = mockRedisStore.get(key);
      if (!entry || Date.now() > entry.expiry) {
        mockRedisStore.delete(key);
        return null;
      }
      return entry.value;
    }),
    del: jest.fn(async (key: string) => {
      const existed = mockRedisStore.delete(key);
      return existed ? 1 : 0;
    }),
    getdel: jest.fn(async (key: string) => {
      const entry = mockRedisStore.get(key);
      if (!entry || Date.now() > entry.expiry) {
        mockRedisStore.delete(key);
        return null;
      }
      mockRedisStore.delete(key);
      return entry.value;
    }),
    eval: jest.fn(async (_script: string, _numKeys: number, key: string) => {
      const entry = mockRedisStore.get(key);
      if (!entry || Date.now() > entry.expiry) {
        mockRedisStore.delete(key);
        return null;
      }
      mockRedisStore.delete(key);
      return entry.value;
    }),
  }),
}));

describe('Phase 2 Security Remediation Test Suite', () => {
  beforeEach(() => {
    mockRedisStore.clear();
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. SEC-CRIT-005: Core RBAC & Permission Hardening
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. SEC-CRIT-005: Core RBAC & Permission Hardening', () => {
    it('should REJECT users with roles containing "admin" (e.g. support_admin) when lacking the exact required permission', async () => {
      const middleware = requirePermission('manage_settings');

      // User assigned a custom role named 'support_admin' with only view_reports permission
      const mockReq: any = {
        user: {
          id: 'user_support_123',
          role: 'role_support_admin',
        },
      };
      const mockRes: any = {};
      let nextError: any = null;
      const next = (err?: any) => {
        nextError = err;
      };

      // Mock role repository returning a role with name 'support_admin' and no manage_settings permission
      const mockRole = {
        id: 'role_support_admin',
        name: 'support_admin',
        permissions: ['view_reports'],
        hasPermission: (perm: string) => perm === 'view_reports',
      };

      jest.spyOn(require('../../roles/infrastructure/repositories/role.repository').RoleRepository.prototype, 'findById')
        .mockResolvedValueOnce(mockRole as any);

      await middleware(mockReq, mockRes, next);

      expect(nextError).toBeInstanceOf(ApiError);
      expect(nextError.statusCode).toBe(403);
      expect(nextError.message).toContain('Missing permission: manage_settings');
    });

    it('should ALLOW access to users with canonical ADMIN role or wildcard permission', async () => {
      const middleware = requirePermission('manage_settings');

      const mockReqAdmin: any = {
        user: {
          id: 'admin_user_1',
          role: 'ADMIN',
        },
      };
      let nextCalled = false;
      await middleware(mockReqAdmin, {} as any, (err?: any) => {
        if (!err) nextCalled = true;
      });
      expect(nextCalled).toBe(true);

      // User with wildcard role
      const mockWildcardReq: any = {
        user: { id: 'super_user_2', role: 'role_super' },
      };
      const mockWildcardRole = {
        id: 'role_super',
        name: 'CUSTOM_SUPER',
        permissions: ['*'],
        hasPermission: (perm: string) => perm === '*' || perm === 'manage_settings',
      };
      jest.spyOn(require('../../roles/infrastructure/repositories/role.repository').RoleRepository.prototype, 'findById')
        .mockResolvedValueOnce(mockWildcardRole as any);

      let wildcardNextCalled = false;
      await middleware(mockWildcardReq, {} as any, (err?: any) => {
        if (!err) wildcardNextCalled = true;
      });
      expect(wildcardNextCalled).toBe(true);
    });

    it('should PREVENT modifying permissions of protected system roles (CUSTOMER, ADMIN)', async () => {
      const mockRoleRepo: Partial<IRoleRepository> = {
        findById: jest.fn().mockResolvedValue({
          id: 'sys_role_cust',
          name: 'CUSTOMER',
          isSystem: true,
          permissions: [],
        }),
      };

      const useCase = new UpdateRoleUseCase(mockRoleRepo as IRoleRepository);

      await expect(
        useCase.execute({
          id: 'sys_role_cust',
          data: {
            permissions: ['*'], // Attempt to grant wildcard to CUSTOMER
          },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should PREVENT non-super-admins from granting permissions they do not possess', async () => {
      const mockRoleRepo: Partial<IRoleRepository> = {
        findById: jest.fn().mockResolvedValue({
          id: 'role_staff_manager',
          name: 'STAFF_MANAGER',
          level: 50,
          permissions: ['view_staff', 'manage_staff'],
        }),
      };

      const controller = new RoleController(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockRoleRepo as IRoleRepository
      );

      const req: any = {
        user: { id: 'staff_1', role: 'role_staff_manager' },
        body: {
          name: 'NEW_TEAM_ROLE',
          level: 30,
          permissions: ['view_staff', 'manage_settings', 'manage_refunds'], // Escalating to settings and refunds!
        },
      };

      let caughtError: any = null;
      await controller.create(req, {} as any, (err) => {
        caughtError = err;
      });

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.statusCode).toBe(403);
      expect(caughtError.message).toContain('Permission Escalation Violation');
      expect(caughtError.message).toContain('manage_settings');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SEC-CRIT-006: Settings API Authorization & Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. SEC-CRIT-006: Settings API Authorization & Validation', () => {
    it('should REJECT unauthenticated users attempting to read private settings keys', async () => {
      const controller = new SettingsController();
      const mockReq: any = {
        params: { key: 'payment_gateway_internal' },
        user: undefined, // unauthenticated
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.getSetting(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied'),
        })
      );
    });

    it('should ALLOW reading public storefront settings keys without authentication', async () => {
      const controller = new SettingsController();
      const mockReq: any = {
        params: { key: 'store_config' },
        user: undefined,
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      jest.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce(null as any);

      await controller.getSetting(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ storeName: "YOX Men's Fashion" }),
        })
      );
    });

    it('should REJECT invalid or malformed store configuration payloads in storeConfigSchema', () => {
      // Invalid: negative shipping threshold and invalid email
      const invalidPayload = {
        storeName: '',
        freeShippingThreshold: -50,
        supportEmail: 'not-an-email',
        codMaxLimit: -100,
        maintenanceMode: 'not-a-boolean',
      };

      const result = storeConfigSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues || (result.error as any).errors || [];
        const errorFields = issues.map((e: any) => e.path[0]);
        expect(errorFields).toContain('storeName');
        expect(errorFields).toContain('freeShippingThreshold');
        expect(errorFields).toContain('supportEmail');
        expect(errorFields).toContain('codMaxLimit');
        expect(errorFields).toContain('maintenanceMode');
      }
    });

    it('should ACCEPT valid store configuration payloads in storeConfigSchema', () => {
      const validPayload = {
        storeName: 'YOX Fashion Updated',
        supportEmail: 'support@yoxfashion.com',
        freeShippingThreshold: 999,
        codEnabled: true,
        codMaxLimit: 5000,
        maintenanceMode: false,
      };

      const result = storeConfigSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SEC-HIGH-002: MSG91 OTP Fail-Closed & E.164 Matching
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. SEC-HIGH-002: MSG91 OTP Fail-Closed & Strict Phone Matching', () => {
    it('should FAIL CLOSED when MSG91 response is missing the verified identifier', async () => {
      // Mock fetch returning successful HTTP status but omitting mobile identifier in response body
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', message: 'Token verified' }), // missing 'mobile' / 'identifier'
      } as any);

      await expect(
        msg91OtpService.verifyToken('valid_access_token_123', '9876543210')
      ).rejects.toThrow(ValidationError);
    });

    it('should REJECT phone numbers with different country codes sharing the same last 10 digits', async () => {
      // MSG91 verified US number (+1 9876543210), but user input was Indian (+91 9876543210)
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          mobile: '19876543210', // US country code +1
        }),
      } as any);

      await expect(
        msg91OtpService.verifyToken('valid_token_xyz', '919876543210') // India country code +91
      ).rejects.toThrow('The verified mobile number does not match the registered mobile number.');
    });

    it('should PREVENT attaching a phone number that is already registered to another account in UpdateProfileUseCase', async () => {
      const existingUser = User.reconstitute({
        id: 'user_target_456',
        fullName: 'Existing Customer',
        email: 'other@yox.internal',
        phone: '9876543210',
        password: 'hashed_password',
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const currentUser = User.reconstitute({
        id: 'user_current_123',
        fullName: 'Current User',
        email: 'current@yox.internal',
        phone: null,
        password: 'hashed_password',
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findById: jest.fn().mockResolvedValue(currentUser),
        findByPhone: jest.fn().mockResolvedValue(existingUser), // Phone already taken!
      };

      jest.spyOn(RoleModel, 'findById').mockReturnValue({
        select: () => ({
          lean: () => Promise.resolve({ name: 'CUSTOMER' }),
        }),
      } as any);

      const useCase = new UpdateProfileUseCase(mockUserRepo as IUserRepository);

      await expect(
        useCase.execute('user_current_123', {
          phone: '9876543210',
          verificationToken: 'token_abc',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SEC-HIGH-003: JWT Storage & SSE URL Query Token Rejection
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. SEC-HIGH-003: JWT Storage & SSE Security', () => {
    it('should REJECT authentication when JWT is passed via URL query parameter ?token=', async () => {
      const validToken = signAccessToken({
        sub: 'user_123',
        email: 'test@yox.com',
        role: 'role_cust',
        tokenVersion: 0,
      });

      const mockReq: any = {
        headers: {},
        cookies: {},
        query: {
          token: validToken, // Query parameter transmission
        },
      };

      let caughtError: any = null;
      await requireAuth(mockReq, {} as any, (err?: any) => {
        caughtError = err;
      });

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.statusCode).toBe(401);
      expect(caughtError.message).toContain('Authentication required');
    });

    it('should AUTHENTICATE SSE connections via short-lived single-use tickets', async () => {
      const ticket = crypto.randomUUID();
      mockRedisStore.set(`sse_ticket:${ticket}`, {
        value: 'user_sse_789',
        expiry: Date.now() + 30000,
      });

      jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce({
            _id: 'user_sse_789',
            email: 'admin@yox.com',
            roleId: 'ADMIN',
            status: 'ACTIVE',
            tokenVersion: 0,
          }),
        }),
      } as any);

      const mockReq: any = {
        headers: {},
        cookies: {},
        query: { ticket },
      };

      let nextCalled = false;
      await requireAuth(mockReq, {} as any, (err?: any) => {
        if (!err) nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe('user_sse_789');

      // Verify ticket was atomically consumed from Redis (single-use)
      expect(mockRedisStore.has(`sse_ticket:${ticket}`)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. SEC-HIGH-005: Password Reset Replay & Session Invalidation
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. SEC-HIGH-005: Password Reset Single-Use & Session Invalidation', () => {
    it('should STORE single-use reset token in Redis with jti and REJECT token reuse', async () => {
      const testUser = User.reconstitute({
        id: 'user_pwd_123',
        fullName: 'Customer Test',
        email: 'customer@yoxfashion.com',
        phone: '9876543210',
        password: 'old_hashed_password',
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findByEmail: jest.fn().mockResolvedValue(testUser),
        findById: jest.fn().mockResolvedValue(testUser),
        update: jest.fn().mockImplementation(async (_id, u) => u),
      };

      const forgotUseCase = new ForgotPasswordUseCase(mockUserRepo as IUserRepository);
      await forgotUseCase.execute('customer@yoxfashion.com');

      // Identify the stored jti key in Redis
      const storedKeys = Array.from(mockRedisStore.keys()).filter((k) => k.startsWith('pwd_reset:'));
      expect(storedKeys.length).toBe(1);
      const jti = storedKeys[0].replace('pwd_reset:', '');

      const resetToken = signResetToken({ sub: testUser.id, jti });
      const resetUseCase = new ResetPasswordUseCase(mockUserRepo as IUserRepository);

      // First reset attempt must succeed
      await resetUseCase.execute({
        token: resetToken,
        password: 'NewStrongPassword123!',
      });

      // Token in Redis must now be consumed (deleted)
      expect(mockRedisStore.has(`pwd_reset:${jti}`)).toBe(false);

      // Replay attempt with the exact same reset token must be REJECTED
      await expect(
        resetUseCase.execute({
          token: resetToken,
          password: 'AnotherPassword123!',
        })
      ).rejects.toThrow('This password reset link is invalid or has already been used.');
    });

    it('should INCREMENT tokenVersion on password change and REVOKE active sessions with old tokenVersion', async () => {
      const initialVersion = 0;
      const user = User.reconstitute({
        id: 'user_session_revoked',
        fullName: 'Staff User',
        email: 'staff@yoxfashion.com',
        phone: '9876543210',
        password: 'current_password_hash',
        roleId: 'role_staff',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        tokenVersion: initialVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Old session token issued with initial tokenVersion = 0
      const oldSessionToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.roleId,
        tokenVersion: initialVersion,
      });

      // User changes password -> updatePassword increments tokenVersion to 1
      user.updatePassword('new_hashed_password');
      expect(user.tokenVersion).toBe(1);

      // Simulate requireAuth receiving the old token when the database now has tokenVersion = 1
      jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce({
            _id: user.id,
            email: user.email,
            roleId: user.roleId,
            status: 'ACTIVE',
            tokenVersion: 1, // Incremented in database
          }),
        }),
      } as any);

      const mockReq: any = {
        headers: { authorization: `Bearer ${oldSessionToken}` },
        cookies: {},
      };

      let caughtError: any = null;
      await requireAuth(mockReq, {} as any, (err?: any) => {
        caughtError = err;
      });

      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.statusCode).toBe(401);
      expect(caughtError.message).toContain('Session has been revoked due to a password change');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SEC-HIGH-006: Storefront Phone OTP Privileged Account Restriction
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. SEC-HIGH-006: Phone OTP Privileged Account Isolation', () => {
    it('should REJECT mobile OTP login if the phone belongs to an administrator or staff account', async () => {
      // Staff member with active phone in database
      const staffUser = User.reconstitute({
        id: 'admin_user_priv',
        fullName: 'Store Admin',
        email: 'admin@yox.com',
        phone: '9876543210',
        password: 'password_hash',
        roleId: 'role_admin_priv',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findAllByPhone: jest.fn().mockResolvedValue([staffUser]),
      };

      const mockRoleRepo: Partial<IRoleRepository> = {
        findById: jest.fn().mockResolvedValue({
          id: 'role_admin_priv',
          name: 'ADMIN',
          level: 100,
          permissions: ['*'],
        }),
      };

      // Mock OTP service token verification as passing
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValueOnce({
        verified: true,
        identifier: '9876543210',
      });

      const useCase = new LoginPhoneUseCase(
        mockUserRepo as IUserRepository,
        mockRoleRepo as IRoleRepository
      );

      await expect(
        useCase.execute({
          phone: '9876543210',
          verificationToken: 'valid_otp_widget_token',
        })
      ).rejects.toThrow(
        'Administrative and staff accounts cannot authenticate via storefront mobile OTP. Please sign in via the Admin Portal using your work email and password.'
      );
    });

    it('should REJECT account selection if a privileged account ID is supplied to login-phone-select', async () => {
      const staffUser = User.reconstitute({
        id: 'admin_user_select',
        fullName: 'Store Manager',
        email: 'manager@yox.com',
        phone: '9876543210',
        password: 'password_hash',
        roleId: 'role_manager',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const selectionToken = signAccessToken({
        phone: '9876543210',
        purpose: 'phone_account_selection',
        candidateIds: ['admin_user_select'],
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findById: jest.fn().mockResolvedValue(staffUser),
      };

      const mockRoleRepo: Partial<IRoleRepository> = {
        findById: jest.fn().mockResolvedValue({
          id: 'role_manager',
          name: 'MANAGER',
          level: 75,
          permissions: ['manage_products', 'manage_orders'],
        }),
      };

      const useCase = new LoginPhoneSelectUseCase(
        mockUserRepo as IUserRepository,
        mockRoleRepo as IRoleRepository
      );

      await expect(
        useCase.execute({
          selectionToken,
          userId: 'admin_user_select',
        })
      ).rejects.toThrow('Administrative and staff accounts cannot authenticate via storefront mobile OTP.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SEC-HIGH-007: Staff Role Escalation & Archived User Restoration
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. SEC-HIGH-007: Staff Escalation & Archived User Restoration', () => {
    it('should PREVENT restoring archived users without explicit administrator authorization', async () => {
      const archivedUser = User.reconstitute({
        id: 'user_deleted_999',
        fullName: 'Archived User',
        email: 'archived@yox.internal',
        phone: '9876543210',
        password: 'hash',
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.INACTIVE,
        deletedAt: new Date(), // Soft deleted
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findById: jest.fn().mockResolvedValue(archivedUser),
        update: jest.fn().mockResolvedValue(archivedUser),
      };

      const useCase = new UpdateUserStatusUseCase(mockUserRepo as IUserRepository);

      // Caller without superAdmin or manage_users permission attempts to activate deleted user
      await expect(
        useCase.execute({
          userId: 'user_deleted_999',
          status: UserStatus.ACTIVE,
          actor: {
            isSuperAdmin: false,
            permissions: ['view_staff'], // Lacks restore authority
          },
        })
      ).rejects.toThrow('Only authorized administrators can restore archived user accounts.');
    });

    it('should REJECT role changes on soft-deleted / archived accounts', async () => {
      const archivedUser = User.reconstitute({
        id: 'user_archived_role',
        fullName: 'Archived Staff',
        email: 'staff_archived@yox.com',
        phone: '9876543210',
        password: 'hash',
        roleId: 'role_staff',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.INACTIVE,
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUserRepo: Partial<IUserRepository> = {
        findById: jest.fn().mockResolvedValue(archivedUser),
      };

      const mockRoleRepo: Partial<IRoleRepository> = {
        findById: jest.fn().mockResolvedValue({
          id: 'role_new',
          name: 'NEW_ROLE',
          permissions: [],
        }),
      };

      const useCase = new UpdateUserRoleUseCase(
        mockUserRepo as IUserRepository,
        mockRoleRepo as IRoleRepository
      );

      await expect(
        useCase.execute({
          userId: 'user_archived_role',
          roleId: 'role_new',
        })
      ).rejects.toThrow('Cannot change role of an archived/deleted account');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. SEC-MED-010: Strong Password Complexity Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  describe('8. SEC-MED-010: Password Complexity Policy', () => {
    it('should REJECT passwords shorter than 8 characters', () => {
      expect(strongPasswordSchema.safeParse('Ab1!').success).toBe(false);
      expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'Short1!' }).success).toBe(false);
    });

    it('should REJECT passwords lacking uppercase letters', () => {
      const result = strongPasswordSchema.safeParse('nouppercase123!');
      expect(result.success).toBe(false);
    });

    it('should REJECT passwords lacking lowercase letters', () => {
      const result = strongPasswordSchema.safeParse('NOLOWERCASE123!');
      expect(result.success).toBe(false);
    });

    it('should REJECT passwords lacking digits', () => {
      const result = strongPasswordSchema.safeParse('NoDigitsHereSpecial!');
      expect(result.success).toBe(false);
    });

    it('should REJECT passwords lacking special characters', () => {
      const result = strongPasswordSchema.safeParse('NoSpecialCharacter123');
      expect(result.success).toBe(false);
    });

    it('should ACCEPT strong compliant passwords meeting all security criteria', () => {
      expect(strongPasswordSchema.safeParse('P@ssw0rd2026!Secured').success).toBe(true);
      expect(
        resetPasswordSchema.safeParse({
          token: 'valid_token_xyz',
          password: 'P@ssw0rd2026!Secured',
        }).success
      ).toBe(true);
    });
  });
});

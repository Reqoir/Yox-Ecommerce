/**
 * @file customer-data-protection.test.ts
 * @description Comprehensive automated security test suite for Phase 3: Customer Information Protection.
 *
 * Covers:
 *  - P3-HIGH-01 (SEC-HIGH-010): Cross-customer IDORs on Shipments, Invoices, Courier Sync & Refunds
 *  - P3-HIGH-02 (SEC-HIGH-001): Cross-user Notification BOLA & Broadcast deletion protection
 *  - P3-HIGH-03: Staff permission boundaries (view_staff / manage_staff cannot read Customer PII)
 *  - P3-MED-01 (SEC-MED-006): Profile Zod validation, email verification reset, CastError 400 mapping
 *  - P3-MED-02: Order & Return ForbiddenError/NotFoundError mapping
 *  - P3-MED-03: Phone password reset email masking, privileged-account blocking & reset-secret enforcement
 *  - P3-LOW-01 (SEC-LOW-001): Synthetic @user.yox.internal email masking in GET /users/me
 */

import { ForbiddenError } from '@core/application/errors/application.error';
import { ApiError } from '@shared/utils/api-error.util';
import {
  GetShipmentByIdUseCase,
  GetShipmentByOrderUseCase,
  GenerateShipmentInvoiceUseCase,
} from '../../shipments/application/use-cases/shipment.use-cases';
import { GetRefundsByOrderUseCase } from '../../payments/application/use-cases/refund.use-cases';
import {
  MarkNotificationReadUseCase,
  MarkManyNotificationsReadUseCase,
  DeleteNotificationUseCase,
  DeleteManyNotificationsUseCase,
} from '../../notifications/application/use-cases/notification.use-cases';
import { UserController } from '../presentation/controllers/user.controller';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';
import { updateProfileSchema } from '../presentation/validators/user.validator';
import { User, UserStatus } from '../domain/entities/user.entity';
import { GetOrderByIdUseCase, CancelOrderUseCase } from '../../orders/application/use-cases/order.use-cases';
import { GetReturnByIdUseCase } from '../../returns/application/use-cases/return.use-cases';
import { ResetPasswordPhoneVerifyUseCase } from '../../auth/application/use-cases/reset-password-phone-verify.use-case';
import { ResetPasswordPhoneConfirmUseCase } from '../../auth/application/use-cases/reset-password-phone-confirm.use-case';
import { msg91OtpService } from '../../auth/infrastructure/services/msg91-otp.service';
import { signAccessToken, signResetToken } from '@shared/utils/jwt.helper';
import { errorHandler } from '../../../presentation/http/middleware/error-handler.middleware';
import { ShiprocketService } from '../../shipments/infrastructure/services/shiprocket.service';
import * as redisClientModule from '@core/infrastructure/database/redis/client';
import { env } from '@core/infrastructure/config/env';

describe('Phase 3: Customer Information Protection Security Test Suite', () => {
  const CUST_A = '6aeddbffc5b528381f3a8c01';
  const CUST_B = '6aeddbffc5b528381f3a8c02';
  const ORDER_B_ID = '6aeddbffc5b528381f3a8d02';
  const SHIPMENT_B_ID = '6aeddbffc5b528381f3a8e02';
  const RETURN_B_ID = '6aeddbffc5b528381f3a8f02';

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. P3-HIGH-01 (SEC-HIGH-010): SHIPMENT, INVOICE & REFUND IDORs
  // =========================================================================
  describe('P3-HIGH-01: Shipment, Tax Invoice & Refund Ownership Enforcement', () => {
    const mockOrderB: any = {
      id: ORDER_B_ID,
      orderNumber: 'YOX-2026-999002',
      userId: CUST_B,
      shiprocketOrderId: 123456,
      shippingAddress: { postalCode: '670001' },
      paymentMethod: 'COD',
    };

    const mockShipmentB: any = {
      id: SHIPMENT_B_ID,
      orderId: ORDER_B_ID,
      deliveryPartnerId: 'Delhivery',
      trackingNumber: 'AWB999002',
      status: 'SHIPPED',
      estimatedDeliveryDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockShipmentRepo: any = {
      findById: jest.fn().mockResolvedValue(mockShipmentB),
      findByOrderId: jest.fn().mockResolvedValue(mockShipmentB),
      save: jest.fn().mockResolvedValue(mockShipmentB),
    };

    const mockOrderRepo: any = {
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(id === ORDER_B_ID ? mockOrderB : null)
      ),
      findByOrderNumber: jest.fn().mockImplementation((num: string) =>
        Promise.resolve(num === mockOrderB.orderNumber ? mockOrderB : null)
      ),
    };

    const mockRefundRepo: any = {
      findByOrderId: jest.fn().mockResolvedValue([
        {
          id: 'ref_1',
          orderId: ORDER_B_ID,
          amount: 1499,
          paymentMethod: 'RAZORPAY',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    it('1. Blocks Customer A from reading Customer B shipment by shipment ID', async () => {
      const uc = new GetShipmentByIdUseCase(mockShipmentRepo, mockOrderRepo);
      await expect(
        uc.execute({ id: SHIPMENT_B_ID, userId: CUST_A, isAdmin: false })
      ).rejects.toThrow(ForbiddenError);
    });

    it('2. Blocks Customer A from reading Customer B shipment by orderId or orderNumber', async () => {
      const uc = new GetShipmentByOrderUseCase(mockShipmentRepo, mockOrderRepo);
      await expect(
        uc.execute({ orderId: ORDER_B_ID, userId: CUST_A, isAdmin: false })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        uc.execute({ orderId: 'YOX-2026-999002', userId: CUST_A, isAdmin: false })
      ).rejects.toThrow(ForbiddenError);
    });

    it('3. Blocks Customer A from generating/downloading Customer B Shiprocket tax invoice', async () => {
      const uc = new GenerateShipmentInvoiceUseCase(mockShipmentRepo, mockOrderRepo);
      await expect(
        uc.execute({ orderId: ORDER_B_ID, userId: CUST_A, isAdmin: false })
      ).rejects.toThrow(ForbiddenError);
    });

    it('4. Allows Customer B to access their own invoice and Admin to access any invoice', async () => {
      jest
        .spyOn(ShiprocketService.getInstance(), 'printInvoice')
        .mockResolvedValue('https://shiprocket.example/invoice.pdf');

      const uc = new GenerateShipmentInvoiceUseCase(mockShipmentRepo, mockOrderRepo);
      const ownRes = await uc.execute({ orderId: ORDER_B_ID, userId: CUST_B, isAdmin: false });
      expect(ownRes.invoiceUrl).toBe('https://shiprocket.example/invoice.pdf');

      const adminRes = await uc.execute({ orderId: ORDER_B_ID, userId: CUST_A, isAdmin: true });
      expect(adminRes.invoiceUrl).toBe('https://shiprocket.example/invoice.pdf');
    });

    it('5. Blocks Customer A from reading Customer B order refunds via GET /payments/order/:orderId', async () => {
      const uc = new GetRefundsByOrderUseCase(mockRefundRepo, mockOrderRepo);
      await expect(
        uc.execute({ orderId: ORDER_B_ID, userId: CUST_A, isAdmin: false })
      ).rejects.toThrow(ForbiddenError);

      const ownRefunds = await uc.execute({ orderId: ORDER_B_ID, userId: CUST_B, isAdmin: false });
      expect(ownRefunds).toHaveLength(1);
      expect(ownRefunds[0].amount).toBe(1499);
    });
  });

  // =========================================================================
  // 2. P3-HIGH-02 (SEC-HIGH-001): NOTIFICATION BOLA & BROADCAST PROTECTION
  // =========================================================================
  describe('P3-HIGH-02: Notification BOLA & Broadcast Deletion Protection', () => {
    it('6. Passes caller userId & allowedTypes to repository in bulk-read and bulk-delete', async () => {
      const mockRepo: any = {
        markManyRead: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue(undefined),
      };

      const markMany = new MarkManyNotificationsReadUseCase(mockRepo);
      await markMany.execute({ ids: ['n1', 'n2'], userId: CUST_A, allowedTypes: [] });
      expect(mockRepo.markManyRead).toHaveBeenCalledWith(['n1', 'n2'], CUST_A, []);

      const delMany = new DeleteManyNotificationsUseCase(mockRepo);
      await delMany.execute({ ids: ['n1', 'n2'], userId: CUST_A, allowedTypes: [] });
      expect(mockRepo.deleteMany).toHaveBeenCalledWith(['n1', 'n2'], CUST_A, []);
    });

    it('7. Blocks Customer A from marking Customer B or broadcast notifications as read', async () => {
      const mockRepo: any = {
        findById: jest
          .fn()
          .mockResolvedValueOnce({ id: 'n_b', userId: CUST_B, markAsRead: jest.fn() })
          .mockResolvedValueOnce({ id: 'n_broadcast', userId: null, markAsRead: jest.fn() }),
        save: jest.fn(),
      };

      const uc = new MarkNotificationReadUseCase(mockRepo);
      await expect(uc.execute({ id: 'n_b', userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );
      await expect(uc.execute({ id: 'n_broadcast', userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );
    });

    it('8. Blocks Customer A from deleting Customer B or broadcast (userId: null) notifications', async () => {
      const mockRepo: any = {
        findById: jest
          .fn()
          .mockResolvedValueOnce({ id: 'n_b', userId: CUST_B })
          .mockResolvedValueOnce({ id: 'n_broadcast', userId: null }),
        delete: jest.fn(),
      };

      const uc = new DeleteNotificationUseCase(mockRepo);
      await expect(uc.execute({ id: 'n_b', userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );
      await expect(uc.execute({ id: 'n_broadcast', userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. P3-HIGH-03: STAFF PERMISSION BOUNDARIES (NO CUSTOMER PII WITHOUT manage_users)
  // =========================================================================
  describe('P3-HIGH-03: Staff Permission Boundaries & Customer PII Isolation', () => {
    const buildUserController = (actorRolePerms: string[], targetRoleName: string) => {
      const mockGetAll = jest.fn().mockResolvedValue({ users: [], meta: {} });
      const mockGetById = jest.fn().mockResolvedValue({
        id: CUST_B,
        fullName: 'Customer B',
        roleName: targetRoleName,
      });
      const mockRoleRepo: any = {
        findById: jest.fn().mockResolvedValue({
          id: 'role_staff',
          name: 'HR_VIEWER',
          level: 30,
          permissions: actorRolePerms,
        }),
      };

      const controller = new UserController(
        {
          execute: jest.fn().mockResolvedValue({
            user: {
              id: CUST_A,
              fullName: 'Mobile User',
              email: '919876543210@user.yox.internal',
              phone: '9876543210',
              profileImage: null,
              roleId: 'customer_role',
              isEmailVerified: false,
              isPhoneVerified: true,
              status: 'ACTIVE',
              createdAt: new Date(),
            },
            permissions: [],
          }),
        } as any,
        {} as any,
        { execute: mockGetAll } as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        { execute: mockGetById } as any,
        {} as any,
        {} as any,
        mockRoleRepo
      );

      return { controller, mockGetAll };
    };

    it('9. Forces userType=staff in GET /users when staff has only view_staff/manage_staff', async () => {
      const { controller, mockGetAll } = buildUserController(['view_staff', 'manage_staff'], 'CUSTOMER');
      const req: any = { user: { id: 'staff1', email: 'hr@yox.com', role: 'role_staff' }, query: { userType: 'customer' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getAll(req, res, next);
      expect(mockGetAll).toHaveBeenCalledWith(expect.objectContaining({ userType: 'staff' }));
    });

    it('10. Allows userType=customer in GET /users when actor has manage_users', async () => {
      const { controller, mockGetAll } = buildUserController(['manage_users'], 'CUSTOMER');
      const req: any = { user: { id: 'mgr1', email: 'mgr@yox.com', role: 'role_staff' }, query: { userType: 'customer' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getAll(req, res, next);
      expect(mockGetAll).toHaveBeenCalledWith(expect.objectContaining({ userType: 'customer' }));
    });

    it('11. Blocks manage_staff-only actor from reading a Customer profile via GET /users/:id', async () => {
      const { controller } = buildUserController(['manage_staff'], 'CUSTOMER');
      const req: any = { params: { id: CUST_B }, user: { id: 'staff1', email: 'hr@yox.com', role: 'role_staff' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(403);
    });

    it('12. Masks synthetic @user.yox.internal email as null in GET /users/me', async () => {
      const { controller } = buildUserController([], 'CUSTOMER');
      const req: any = { user: { id: CUST_A } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getProfile(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.email).toBeNull();
    });
  });

  // =========================================================================
  // 4. P3-MED-01 & P3-MED-02: PROFILE ZOD VALIDATION & CLEAN ERROR MAPPING
  // =========================================================================
  describe('P3-MED-01 & P3-MED-02: Validation, Email Verification Reset & Error Mapping', () => {
    it('13. Rejects javascript: profileImage and unknown fields in updateProfileSchema', () => {
      const badImg = updateProfileSchema.safeParse({ profileImage: 'javascript:alert(1)' });
      expect(badImg.success).toBe(false);

      const extraField = updateProfileSchema.safeParse({ fullName: 'Valid Name', roleId: 'admin' });
      expect(extraField.success).toBe(false);
    });

    it('14. Resets isEmailVerified to false when customer updates their email', async () => {
      const customer = User.reconstitute({
        id: CUST_A,
        fullName: 'Customer A',
        email: 'old@example.com',
        phone: '9876543210',
        password: 'hash',
        roleId: 'customer_role',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockRepo: any = {
        findById: jest.fn().mockResolvedValue(customer),
        findByEmail: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation((_id: string, u: User) => Promise.resolve(u)),
      };
      const mockRoleRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'customer_role', name: 'CUSTOMER' }),
      };

      const uc = new UpdateProfileUseCase(mockRepo, mockRoleRepo);
      const updated = await uc.execute(CUST_A, { email: 'new@example.com' });
      expect(updated.email).toBe('new@example.com');
      expect(updated.isEmailVerified).toBe(false);
    });

    it('15. Throws ForbiddenError on cross-customer Order and Return access', async () => {
      const getOrder = new GetOrderByIdUseCase({
        findById: jest.fn().mockResolvedValue({ id: ORDER_B_ID, userId: CUST_B }),
      } as any);
      await expect(getOrder.execute({ id: ORDER_B_ID, userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );

      const cancelOrder = new CancelOrderUseCase(
        { findById: jest.fn().mockResolvedValue({ id: ORDER_B_ID, userId: CUST_B }) } as any,
        {} as any,
        {} as any,
        {} as any
      );
      await expect(
        cancelOrder.execute({ id: ORDER_B_ID, userId: CUST_A, isAdmin: false, data: {} as any })
      ).rejects.toThrow(ForbiddenError);

      const getReturn = new GetReturnByIdUseCase({
        findById: jest.fn().mockResolvedValue({ id: RETURN_B_ID, userId: CUST_B }),
      } as any);
      await expect(getReturn.execute({ id: RETURN_B_ID, userId: CUST_A, isAdmin: false })).rejects.toThrow(
        ForbiddenError
      );
    });

    it('16. Maps Mongoose CastError to HTTP 400 in global errorHandler', () => {
      const castErr = new Error('Cast to ObjectId failed');
      castErr.name = 'CastError';
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      errorHandler(castErr, { method: 'GET', originalUrl: '/api/v1/orders/bad', ip: '127.0.0.1' } as any, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =========================================================================
  // 5. P3-MED-03: PHONE PASSWORD RESET HARDENING
  // =========================================================================
  describe('P3-MED-03: Phone Password Reset Masking, Privileged Block & Token Security', () => {
    it('17. Omits raw email and blocks privileged accounts during phone password reset verification', async () => {
      jest.spyOn(msg91OtpService, 'verifyToken').mockResolvedValue({ verified: true, identifier: '919876543210' });

      const customer = User.reconstitute({
        id: CUST_A,
        fullName: 'Alice',
        email: 'alice.secret@example.com',
        phone: '9876543210',
        password: 'hash',
        roleId: 'role_cust',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const adminUser = User.reconstitute({
        id: 'admin_1',
        fullName: 'Admin',
        email: 'admin@yox.com',
        phone: '8089399521',
        password: 'hash',
        roleId: 'role_admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockRoleRepo: any = {
        findById: jest.fn().mockImplementation((id: string) =>
          Promise.resolve(
            id === 'role_cust'
              ? { id: 'role_cust', name: 'CUSTOMER', level: 0, permissions: [] }
              : { id: 'role_admin', name: 'Admin', level: 100, permissions: ['*'] }
          )
        ),
      };

      const verifyUc = new ResetPasswordPhoneVerifyUseCase(
        { findAllByPhone: jest.fn().mockResolvedValue([customer]) } as any,
        mockRoleRepo
      );
      const res = await verifyUc.execute({ phone: '9876543210', verificationToken: 'tok1' });
      expect((res.user as any).email).toBeUndefined();
      expect(res.user?.maskedEmail).toBe('a***t@example.com');

      const verifyAdminUc = new ResetPasswordPhoneVerifyUseCase(
        { findAllByPhone: jest.fn().mockResolvedValue([adminUser]) } as any,
        mockRoleRepo
      );
      await expect(
        verifyAdminUc.execute({ phone: '8089399521', verificationToken: 'tok2' })
      ).rejects.toThrow('Administrative and staff accounts cannot reset passwords via customer mobile OTP');
    });

    it('18. Rejects access tokens or malformed tokens in ResetPasswordPhoneConfirmUseCase', async () => {
      const confirmUc = new ResetPasswordPhoneConfirmUseCase({} as any);
      const wrongSecretToken = signAccessToken({
        sub: CUST_A,
        email: 'a@b.com',
        role: 'role_cust',
      });

      await expect(
        confirmUc.execute({
          resetToken: wrongSecretToken,
          userId: CUST_A,
          newPassword: 'StrongPassword123!',
        })
      ).rejects.toThrow('Password reset session has expired');
    });

    it('19. Fails closed in production when Redis is unavailable during phone password reset confirm', async () => {
      const originalNodeEnv = env.NODE_ENV;
      (env as any).NODE_ENV = 'production';
      jest.spyOn(redisClientModule, 'getRedisClient').mockReturnValue({ status: 'reconnecting' } as any);

      try {
        const confirmUc = new ResetPasswordPhoneConfirmUseCase({} as any);
        const validResetToken = signResetToken({
          sub: CUST_A,
          jti: 'jti-123',
          phone: '9876543210',
          candidateIds: [CUST_A],
          purpose: 'phone_password_reset',
        });

        await expect(
          confirmUc.execute({
            resetToken: validResetToken,
            userId: CUST_A,
            newPassword: 'StrongPassword123!',
          })
        ).rejects.toThrow('Unable to validate password reset session at this time');
      } finally {
        (env as any).NODE_ENV = originalNodeEnv;
      }
    });
  });
});

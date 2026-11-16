/**
 * @file role-hierarchy-sync.test.ts
 * @description Comprehensive Automated Tests for Role Hierarchy, Permissions, and System Role Protection.
 */

import { Role } from '../domain/entities/role.entity';
import { TARGET_SYSTEM_ROLES, SYSTEM_PERMISSIONS } from '../domain/constants/role.constants';
import { UpdateRoleUseCase } from '../application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../application/use-cases/delete-role.use-case';
import { IRoleRepository } from '../domain/repositories/role.repository.interface';
import { IUserRepository } from '../../users/domain/repositories/user.repository.interface';
import { ValidationError } from '@core/application/errors/application.error';
import { requirePermission } from '../../../presentation/http/middleware/require-permission.middleware';

describe('Role Hierarchy & System Role Protection Test Suite', () => {
  let mockRoleRepo: jest.Mocked<IRoleRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRoleRepo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IRoleRepository>;

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
  });

  describe('1. System Role Hierarchy Definitions', () => {
    it('should define exactly 18 functional system permissions', () => {
      expect(SYSTEM_PERMISSIONS).toHaveLength(18);
      expect(new Set(SYSTEM_PERMISSIONS).size).toBe(18); // No duplicates
      expect(SYSTEM_PERMISSIONS).toContain('dashboard:read');
      expect(SYSTEM_PERMISSIONS).toContain('manage_products');
      expect(SYSTEM_PERMISSIONS).toContain('manage_inventory');
      expect(SYSTEM_PERMISSIONS).toContain('manage_brands');
      expect(SYSTEM_PERMISSIONS).toContain('manage_categories');
      expect(SYSTEM_PERMISSIONS).toContain('manage_orders');
      expect(SYSTEM_PERMISSIONS).toContain('manage_users');
      expect(SYSTEM_PERMISSIONS).toContain('view_staff');
      expect(SYSTEM_PERMISSIONS).toContain('manage_staff');
      expect(SYSTEM_PERMISSIONS).toContain('manage_roles');
      expect(SYSTEM_PERMISSIONS).toContain('manage_settings');
      expect(SYSTEM_PERMISSIONS).toContain('view_analytics');
      expect(SYSTEM_PERMISSIONS).toContain('view_reports');
      expect(SYSTEM_PERMISSIONS).toContain('view_audit_logs');
      expect(SYSTEM_PERMISSIONS).toContain('manage_reviews');
      expect(SYSTEM_PERMISSIONS).toContain('manage_offers');
      expect(SYSTEM_PERMISSIONS).toContain('manage_content');
      expect(SYSTEM_PERMISSIONS).toContain('manage_notifications');
    });

    it('should configure System Admin at Rank 100 with all 18 permissions and isSystem=true', () => {
      const adminRole = TARGET_SYSTEM_ROLES.find((r) => r.name === 'Admin');
      expect(adminRole).toBeDefined();
      expect(adminRole!.level).toBe(100);
      expect(adminRole!.isSystem).toBe(true);
      expect(adminRole!.permissions).toHaveLength(18);
      // All 18 permissions present
      SYSTEM_PERMISSIONS.forEach((p) => {
        expect(adminRole!.permissions).toContain(p);
      });
    });

    it('should configure Manager at Rank 75 with exactly 14 operational permissions and restricted administrative powers', () => {
      const managerRole = TARGET_SYSTEM_ROLES.find((r) => r.name === 'MANAGER');
      expect(managerRole).toBeDefined();
      expect(managerRole!.level).toBe(75);
      expect(managerRole!.isSystem).toBe(true);
      expect(managerRole!.permissions).toHaveLength(14);

      // Must have operational powers
      expect(managerRole!.permissions).toContain('dashboard:read');
      expect(managerRole!.permissions).toContain('view_analytics');
      expect(managerRole!.permissions).toContain('view_reports');
      expect(managerRole!.permissions).toContain('manage_products');
      expect(managerRole!.permissions).toContain('manage_categories');
      expect(managerRole!.permissions).toContain('manage_brands');
      expect(managerRole!.permissions).toContain('manage_inventory');
      expect(managerRole!.permissions).toContain('manage_orders');
      expect(managerRole!.permissions).toContain('manage_users');
      expect(managerRole!.permissions).toContain('manage_offers');
      expect(managerRole!.permissions).toContain('manage_reviews');
      expect(managerRole!.permissions).toContain('manage_content');
      expect(managerRole!.permissions).toContain('manage_notifications');
      expect(managerRole!.permissions).toContain('view_staff');

      // Must NOT have sensitive administrative powers
      expect(managerRole!.permissions).not.toContain('manage_roles');
      expect(managerRole!.permissions).not.toContain('manage_staff');
      expect(managerRole!.permissions).not.toContain('manage_settings');
      expect(managerRole!.permissions).not.toContain('view_audit_logs');
    });

    it('should configure Editor at Rank 50 with exactly 6 editing permissions', () => {
      const editorRole = TARGET_SYSTEM_ROLES.find((r) => r.name === 'EDITOR');
      expect(editorRole).toBeDefined();
      expect(editorRole!.level).toBe(50);
      expect(editorRole!.isSystem).toBe(true);
      expect(editorRole!.permissions).toHaveLength(6);

      expect(editorRole!.permissions).toContain('manage_products');
      expect(editorRole!.permissions).toContain('manage_categories');
      expect(editorRole!.permissions).toContain('manage_brands');
      expect(editorRole!.permissions).toContain('manage_content');
      expect(editorRole!.permissions).toContain('manage_reviews');
      expect(editorRole!.permissions).toContain('manage_orders');

      // Strictly no administrative, staff, settings, or financial permissions
      expect(editorRole!.permissions).not.toContain('manage_roles');
      expect(editorRole!.permissions).not.toContain('manage_staff');
      expect(editorRole!.permissions).not.toContain('manage_settings');
      expect(editorRole!.permissions).not.toContain('view_audit_logs');
      expect(editorRole!.permissions).not.toContain('view_reports');
    });

    it('should configure Customer at Rank 0 with 0 permissions and isSystem=true', () => {
      const customerRole = TARGET_SYSTEM_ROLES.find((r) => r.name === 'CUSTOMER');
      expect(customerRole).toBeDefined();
      expect(customerRole!.level).toBe(0);
      expect(customerRole!.isSystem).toBe(true);
      expect(customerRole!.permissions).toHaveLength(0);
    });
  });

  describe('2. System Role Immutability Protection', () => {
    it('should reject modification of any protected system role', async () => {
      const systemRole = Role.reconstitute({
        id: 'role_sys_mgr',
        name: 'MANAGER',
        description: 'Store manager',
        level: 75,
        permissions: ['manage_products'],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRoleRepo.findById.mockResolvedValue(systemRole);
      const updateRoleUseCase = new UpdateRoleUseCase(mockRoleRepo);

      await expect(
        updateRoleUseCase.execute({
          id: 'role_sys_mgr',
          data: { name: 'MUTATED_MANAGER', permissions: ['manage_roles'] },
        })
      ).rejects.toThrow(ValidationError);

      expect(mockRoleRepo.update).not.toHaveBeenCalled();
    });

    it('should reject deletion of any protected system role', async () => {
      const systemRole = Role.reconstitute({
        id: 'role_sys_admin',
        name: 'ADMIN',
        description: 'System Admin',
        level: 100,
        permissions: ['*'],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRoleRepo.findById.mockResolvedValue(systemRole);
      const deleteRoleUseCase = new DeleteRoleUseCase(mockRoleRepo, mockUserRepo);

      await expect(deleteRoleUseCase.execute('role_sys_admin')).rejects.toThrow(ValidationError);
      expect(mockRoleRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('3. Editor Order Permission Scoping & Financial Operation Isolation', () => {
    it('should allow Editor with manage_orders to access operational order endpoints', async () => {
      const editorRole = {
        id: 'role_editor',
        name: 'EDITOR',
        level: 50,
        permissions: ['manage_orders', 'manage_products'],
        hasPermission: (p: string) => ['manage_orders', 'manage_products'].includes(p),
      };

      jest.spyOn(require('../infrastructure/repositories/role.repository').RoleRepository.prototype, 'findById')
        .mockResolvedValueOnce(editorRole as any);

      // requirePermission('manage_orders')
      const middleware = requirePermission('manage_orders');

      const req: any = { user: { id: 'editor_1', role: 'role_editor' } };
      const res: any = {};
      const next = jest.fn();

      await middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(); // Allowed
    });

    it('should block Editor from accessing financial refund and payment-status endpoints requiring view_reports / manage_settings', async () => {
      const editorRole = {
        id: 'role_editor',
        name: 'EDITOR',
        level: 50,
        permissions: ['manage_orders', 'manage_products', 'manage_categories'],
        hasPermission: (p: string) => ['manage_orders', 'manage_products', 'manage_categories'].includes(p),
      };

      jest.spyOn(require('../infrastructure/repositories/role.repository').RoleRepository.prototype, 'findById')
        .mockResolvedValueOnce(editorRole as any);

      // Endpoint requiring financial authority: requirePermission(['manage_settings', 'view_reports'])
      const financialMiddleware = requirePermission(['manage_settings', 'view_reports']);

      const req: any = { user: { id: 'editor_1', role: 'role_editor' } };
      const res: any = {};
      const next = jest.fn();

      await financialMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain('Missing permission');
    });

    it('should allow Manager with view_reports to access financial refund and payment-status endpoints', async () => {
      const managerRole = {
        id: 'role_manager',
        name: 'MANAGER',
        level: 75,
        permissions: ['manage_orders', 'view_reports', 'manage_products'],
        hasPermission: (p: string) => ['manage_orders', 'view_reports', 'manage_products'].includes(p),
      };

      jest.spyOn(require('../infrastructure/repositories/role.repository').RoleRepository.prototype, 'findById')
        .mockResolvedValueOnce(managerRole as any);

      const financialMiddleware = requirePermission(['manage_settings', 'view_reports']);

      const req: any = { user: { id: 'manager_1', role: 'role_manager' } };
      const res: any = {};
      const next = jest.fn();

      await financialMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith(); // Allowed
    });
  });
});

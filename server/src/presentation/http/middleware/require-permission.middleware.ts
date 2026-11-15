/**
 * @file require-permission.middleware.ts
 * @layer Presentation › HTTP › Middleware
 * 
 * Middleware for Dynamic RBAC.
 * Checks if the authenticated user's role has the required permission.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@shared/utils/api-error.util';
import { RoleRepository } from '../../../modules/roles/infrastructure/repositories/role.repository';

const roleRepository = new RoleRepository();

export const requirePermission = (requiredPermission: string | string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required to access this resource.');
      }

      const userRoleStr = String(req.user.role || '').toLowerCase();

      // Check if user has direct canonical admin role
      if (userRoleStr === 'admin' || userRoleStr === 'super_admin') {
        return next();
      }

      // Fetch role document from DB if roleId is an ObjectId
      let role = null;
      try {
        role = await roleRepository.findById(req.user.role);
      } catch (e) {
        // Fallthrough
      }

      if (role) {
        const roleNameUpper = role.name.toUpperCase();
        if (roleNameUpper === 'ADMIN' || roleNameUpper === 'SUPER_ADMIN') {
          return next();
        }

        if (role.hasPermission('*')) {
          return next();
        }

        const requiredList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

        const checkSinglePermission = (perm: string): boolean => {
          if (role.hasPermission(perm)) return true;

          // Support legitimate read-only dashboard analytics alias
          if (perm === 'dashboard:read' && role.hasPermission('view_analytics')) {
            return true;
          }

          // Staff viewers can view staff list if they have view_staff or manage_staff
          if (perm === 'view_staff' && (role.hasPermission('view_staff') || role.hasPermission('manage_staff'))) {
            return true;
          }

          return false;
        };

        const hasAnyPermission = requiredList.some(checkSinglePermission);
        if (hasAnyPermission) {
          return next();
        }
      }

      const permissionString = Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission;
      throw ApiError.forbidden(`Access denied. Missing permission: ${permissionString}`);
    } catch (error) {
      next(error);
    }
  };
};

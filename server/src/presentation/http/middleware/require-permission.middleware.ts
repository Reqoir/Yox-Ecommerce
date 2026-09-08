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

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required to access this resource.');
      }

      const userRoleStr = String(req.user.role || '').toLowerCase();

      // Check if user is directly an admin/super_admin role
      if (userRoleStr === 'admin' || userRoleStr === 'super_admin' || userRoleStr.includes('admin')) {
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
        const roleNameLower = role.name.toLowerCase();
        if (roleNameLower === 'admin' || roleNameLower === 'super_admin' || roleNameLower.includes('admin')) {
          return next();
        }

        if (role.hasPermission('*') || role.hasPermission(requiredPermission)) {
          return next();
        }

        // Support logical permission aliases
        if (requiredPermission === 'dashboard:read' && role.hasPermission('view_analytics')) {
          return next();
        }

        if (requiredPermission === 'manage_users' && (role.hasPermission('manage_staff') || role.hasPermission('manage_roles'))) {
          return next();
        }

        if (requiredPermission === 'manage_staff' && role.hasPermission('manage_roles')) {
          return next();
        }

        if (
          requiredPermission === 'manage_orders' &&
          (role.hasPermission('manage_shipments') || role.hasPermission('manage_returns'))
        ) {
          return next();
        }
      }

      throw ApiError.forbidden(`Access denied. Missing permission: ${requiredPermission}`);
    } catch (error) {
      next(error);
    }
  };
};

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

// We can instantiate the repository here, or use a cached service for better performance.
const roleRepository = new RoleRepository();

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required to access this resource.');
      }

      // req.user.role is the roleId or role name stored in the JWT
      const roleId = req.user.role;

      if (roleId === 'admin' || roleId === 'super_admin') {
        return next();
      }

      // 1. Fetch the role from DB
      let role = null;
      try {
        role = await roleRepository.findById(roleId);
      } catch (e) {
        // Fallthrough check
      }

      if (role && (role.name === 'admin' || role.name === 'super_admin' || role.hasPermission(requiredPermission))) {
        return next();
      }

      throw ApiError.forbidden(`Access denied. Missing permission: ${requiredPermission}`);
    } catch (error) {
      next(error);
    }
  };
};

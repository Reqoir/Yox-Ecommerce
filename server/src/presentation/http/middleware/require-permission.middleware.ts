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

      // req.user.role is the roleId stored in the JWT
      const roleId = req.user.role;

      // 1. Fetch the role from DB (In production, this should heavily rely on Redis caching)
      const role = await roleRepository.findById(roleId);

      if (!role) {
        throw ApiError.forbidden('Role not found. Access denied.');
      }

      // 2. Check if role has the required permission
      if (!role.hasPermission(requiredPermission)) {
        throw ApiError.forbidden(`Access denied. Missing permission: ${requiredPermission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @file user.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';

const router = Router();

const userRepository = new UserRepository();
const getProfileUseCase = new GetProfileUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);
const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository);
const userController = new UserController(
  getProfileUseCase, 
  updateProfileUseCase,
  getAllUsersUseCase,
  updateUserRoleUseCase
);

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

// Admin routes
router.get('/', requirePermission('manage_users'), userController.getAll);
router.patch('/:id/role', requirePermission('manage_users'), userController.updateRole);

export default router;

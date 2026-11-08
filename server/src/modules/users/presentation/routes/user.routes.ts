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
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UpdateUserStatusUseCase } from '../../application/use-cases/update-user-status.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { UpdateStaffUseCase } from '../../application/use-cases/update-staff.use-case';

import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';

const router = Router();

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const getProfileUseCase = new GetProfileUseCase(userRepository, roleRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);
const updateUserRoleUseCase = new UpdateUserRoleUseCase(userRepository, roleRepository);
const createUserUseCase = new CreateUserUseCase(userRepository, roleRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository, roleRepository);
const updateStaffUseCase = new UpdateStaffUseCase(userRepository, roleRepository);

const userController = new UserController(
  getProfileUseCase, 
  updateProfileUseCase,
  getAllUsersUseCase,
  updateUserRoleUseCase,
  createUserUseCase,
  updateUserStatusUseCase,
  deleteUserUseCase,
  getUserByIdUseCase,
  userRepository,
  updateStaffUseCase,
  roleRepository
);

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

// Admin / Staff routes
router.get('/', requirePermission(['manage_users', 'view_staff', 'manage_staff']), userController.getAll);
router.post('/', requirePermission(['manage_users', 'manage_staff']), userController.create);
router.get('/:id', requirePermission(['manage_users', 'manage_staff']), userController.getById);
router.patch('/:id/role', requirePermission(['manage_roles', 'manage_staff', 'manage_users']), userController.updateRole);
router.patch('/:id/password', requirePermission(['manage_roles', 'manage_staff', 'manage_users']), userController.resetPassword);
router.patch('/:id/status', requirePermission(['manage_users', 'manage_staff']), userController.updateStatus);
router.patch('/:id/staff', requirePermission(['manage_roles', 'manage_staff', 'manage_users']), userController.updateStaff);
router.delete('/:id', requirePermission(['manage_users', 'manage_staff']), userController.delete);

export default router;

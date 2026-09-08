/**
 * @file role.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { GetAllRolesUseCase } from '../../application/use-cases/get-all-roles.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// DI Setup
const roleRepository = new RoleRepository();
const userRepository = new UserRepository();
const createRoleUseCase = new CreateRoleUseCase(roleRepository);
const updateRoleUseCase = new UpdateRoleUseCase(roleRepository);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository, userRepository);

const roleController = new RoleController(
  createRoleUseCase,
  updateRoleUseCase,
  getAllRolesUseCase,
  deleteRoleUseCase,
);

router.use(requireAuth);
 
// Reading roles is permitted for role management and staff management
router.get('/', requirePermission(['manage_roles', 'manage_staff']), roleController.getAll);

// Modifying roles strictly requires 'manage_roles'
router.post('/', requirePermission('manage_roles'), roleController.create);
router.patch('/:id', requirePermission('manage_roles'), roleController.update);
router.delete('/:id', requirePermission('manage_roles'), roleController.delete);

export const roleRoutes = router;

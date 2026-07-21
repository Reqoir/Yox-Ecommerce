/**
 * @file role.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { GetAllRolesUseCase } from '../../application/use-cases/get-all-roles.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// DI Setup
const roleRepository = new RoleRepository();
const createRoleUseCase = new CreateRoleUseCase(roleRepository);
const updateRoleUseCase = new UpdateRoleUseCase(roleRepository);
const getAllRolesUseCase = new GetAllRolesUseCase(roleRepository);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);

const roleController = new RoleController(
  createRoleUseCase,
  updateRoleUseCase,
  getAllRolesUseCase,
  deleteRoleUseCase,
);

// All role management routes require 'manage_roles' permission
router.use(requireAuth);
router.use(requirePermission('manage_roles'));

router.get('/', roleController.getAll);
router.post('/', roleController.create);
router.patch('/:id', roleController.update);
router.delete('/:id', roleController.delete);

export const roleRoutes = router;

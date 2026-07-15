/**
 * @file brand.routes.ts
 * @layer Presentation › Routes
 *
 * Defines the Express routes for Brand endpoints.
 */

import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { CreateBrandUseCase } from '../../application/use-cases/create-brand.use-case';
import { GetBrandUseCase } from '../../application/use-cases/get-brand.use-case';
import { GetAllBrandsUseCase } from '../../application/use-cases/get-all-brands.use-case';
import { UpdateBrandUseCase } from '../../application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from '../../application/use-cases/delete-brand.use-case';
import { BrandRepository } from '../../infrastructure/repositories/brand.repository';
// import { authMiddleware } from '@shared/middlewares/auth.middleware';
// import { authorizeRole } from '@shared/middlewares/role.middleware';
// import { UserRole } from '@shared/constants/roles.constants';

const router = Router();

// DI Setup
const brandRepository = new BrandRepository();
const createBrandUseCase = new CreateBrandUseCase(brandRepository);
const getBrandUseCase = new GetBrandUseCase(brandRepository);
const getAllBrandsUseCase = new GetAllBrandsUseCase(brandRepository);
const updateBrandUseCase = new UpdateBrandUseCase(brandRepository);
const deleteBrandUseCase = new DeleteBrandUseCase(brandRepository);

const brandController = new BrandController(
  createBrandUseCase,
  getBrandUseCase,
  getAllBrandsUseCase,
  updateBrandUseCase,
  deleteBrandUseCase,
);

/**
 * Public Routes
 */
router.get('/', brandController.getAll);
router.get('/:id', brandController.getById);

/**
 * Protected Routes (Admin only)
 * Uncomment middlewares when ready to enforce authorization
 */
router.post(
  '/',
  // authMiddleware,
  // authorizeRole([UserRole.ADMIN]),
  brandController.create,
);

router.patch(
  '/:id',
  // authMiddleware,
  // authorizeRole([UserRole.ADMIN]),
  brandController.update,
);

router.delete(
  '/:id',
  // authMiddleware,
  // authorizeRole([UserRole.ADMIN]),
  brandController.delete,
);

export const brandRoutes = router;

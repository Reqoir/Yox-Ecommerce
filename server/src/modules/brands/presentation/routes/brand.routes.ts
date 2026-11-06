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
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

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

import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

/**
 * Public Routes (Cached in Redis for 10 minutes)
 */
router.get('/', cacheMiddleware(600, 'brands'), brandController.getAll);
router.get('/:id', cacheMiddleware(600, 'brands'), brandController.getById);

/**
 * Protected Routes (Admin only, invalidates brands cache upon mutation)
 */
router.post(
  '/',
  requireAuth,
  requirePermission('manage_brands'),
  async (req, res, next) => {
    await invalidateCache('brands:*');
    return brandController.create(req, res, next);
  },
);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('manage_brands'),
  async (req, res, next) => {
    await invalidateCache('brands:*');
    return brandController.update(req, res, next);
  },
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('manage_brands'),
  async (req, res, next) => {
    await invalidateCache('brands:*');
    return brandController.delete(req, res, next);
  },
);

export const brandRoutes = router;

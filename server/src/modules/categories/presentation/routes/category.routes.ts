/**
 * @file category.routes.ts
 * @layer Presentation › HTTP › Routes
 * 
 * Defines the Express router for Category endpoints.
 */

import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { CategoryRepository } from '../../infrastructure/repositories/category.repository';
import {
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  GetCategoryByIdUseCase,
  GetAllCategoriesUseCase
} from '../../application/use-cases/category.use-cases';

const router = Router();

// Dependency Injection Setup
const categoryRepo = new CategoryRepository();

const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);
const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepo);
const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepo);
const getCategoryByIdUseCase = new GetCategoryByIdUseCase(categoryRepo);
const getAllCategoriesUseCase = new GetAllCategoriesUseCase(categoryRepo);

const categoryController = new CategoryController(
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  getCategoryByIdUseCase,
  getAllCategoriesUseCase
);

import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

// Routes (Cached in Redis for 10 minutes)
router.get('/', cacheMiddleware(600, 'categories'), categoryController.getAll);
router.get('/:id', cacheMiddleware(600, 'categories'), categoryController.getById);

// Protected Admin Routes (Invalidates categories cache on change)
router.post('/', requireAuth, requirePermission('manage_categories'), async (req, res, next) => {
  await invalidateCache('categories:*');
  return categoryController.create(req, res, next);
});
router.patch('/:id', requireAuth, requirePermission('manage_categories'), async (req, res, next) => {
  await invalidateCache('categories:*');
  return categoryController.update(req, res, next);
});
router.delete('/:id', requireAuth, requirePermission('manage_categories'), async (req, res, next) => {
  await invalidateCache('categories:*');
  return categoryController.delete(req, res, next);
});

export { router as categoryRoutes };

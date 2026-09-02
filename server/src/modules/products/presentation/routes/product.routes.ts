/**
 * @file product.routes.ts
 * @layer Presentation › Routes
 * 
 * Defines the Express routes for the Products module.
 */

import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductRepository } from '../../infrastructure/repositories/product.repository';
import { ProductVariantRepository } from '../../infrastructure/repositories/product-variant.repository';
import { 
  CreateProductUseCase, 
  UpdateProductUseCase, 
  DeleteProductUseCase, 
  GetProductByIdUseCase, 
  GetProductByBarcodeUseCase,
  GetAllProductsUseCase,
  GetFeaturedProductsUseCase,
  GetLatestProductsUseCase,
  GetBestSellingProductsUseCase
} from '../../application/use-cases/product.use-cases';

const router = Router();

// Manual Dependency Injection for now (can be replaced with a DI container like Awilix/Inversify later)
const productRepo = new ProductRepository();
const variantRepo = new ProductVariantRepository();

const productController = new ProductController(
  new CreateProductUseCase(productRepo, variantRepo),
  new UpdateProductUseCase(productRepo, variantRepo),
  new DeleteProductUseCase(productRepo, variantRepo),
  new GetProductByIdUseCase(productRepo, variantRepo),
  new GetProductByBarcodeUseCase(productRepo, variantRepo),
  new GetAllProductsUseCase(productRepo, variantRepo),
  new GetFeaturedProductsUseCase(productRepo),
  new GetLatestProductsUseCase(productRepo),
  new GetBestSellingProductsUseCase(productRepo)
);

// Search is often just GET / with query params
router.get('/', productController.getAll); 

// Specialized listing routes
router.get('/featured', productController.getFeatured);
router.get('/latest', productController.getLatest);
router.get('/best-selling', productController.getBestSelling);

import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

// Barcode lookup
router.get('/by-barcode/:barcode', productController.getByBarcode);

// Standard CRUD
router.get('/:id', productController.getById);

// Protected Admin Routes
router.post('/', requireAuth, requirePermission('manage_products'), productController.create);
router.patch('/:id', requireAuth, requirePermission('manage_products'), productController.update);
router.delete('/:id', requireAuth, requirePermission('manage_products'), productController.delete);

export const productRoutes = router;

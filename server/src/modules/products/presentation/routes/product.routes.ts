/**
 * @file product.routes.ts
 * @layer Presentation › Routes
 * 
 * Defines the Express routes for the Products module with e-commerce filters.
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
  GetBestSellingProductsUseCase,
  GetProductFilterFacetsUseCase
} from '../../application/use-cases/product.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

const router = Router();

// Dependency Injection
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
  new GetBestSellingProductsUseCase(productRepo),
  new GetProductFilterFacetsUseCase(productRepo)
);

// 1. E-commerce Filter Facets (Cached for 10 minutes)
router.get('/filters', cacheMiddleware(600, 'products'), productController.getFilters);

// 2. Product Search & Filtered Listing (Cached for 5 minutes)
router.get('/', cacheMiddleware(300, 'products'), productController.getAll); 

// 3. Specialized listing routes (Cached for 5 minutes)
router.get('/featured', cacheMiddleware(300, 'products'), productController.getFeatured);
router.get('/latest', cacheMiddleware(300, 'products'), productController.getLatest);
router.get('/best-selling', cacheMiddleware(300, 'products'), productController.getBestSelling);

// 4. Barcode lookup
router.get('/by-barcode/:barcode', productController.getByBarcode);

// 5. Standard Product Details by ID or Slug (Cached for 10 minutes)
router.get('/:id', cacheMiddleware(600, 'products'), productController.getById);

// 6. Protected Admin Routes (Invalidates product cache upon mutation)
router.post('/', requireAuth, requirePermission('manage_products'), async (req, res, next) => {
  await invalidateCache('products:*');
  return productController.create(req, res, next);
});
router.patch('/:id', requireAuth, requirePermission('manage_products'), async (req, res, next) => {
  await invalidateCache('products:*');
  return productController.update(req, res, next);
});
router.delete('/:id', requireAuth, requirePermission('manage_products'), async (req, res, next) => {
  await invalidateCache('products:*');
  return productController.delete(req, res, next);
});

export const productRoutes = router;

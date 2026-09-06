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

// 1. E-commerce Filter Facets (must be before /:id)
router.get('/filters', productController.getFilters);

// 2. Product Search & Filtered Listing
router.get('/', productController.getAll); 

// 3. Specialized listing routes
router.get('/featured', productController.getFeatured);
router.get('/latest', productController.getLatest);
router.get('/best-selling', productController.getBestSelling);

// 4. Barcode lookup
router.get('/by-barcode/:barcode', productController.getByBarcode);

// 5. Standard Product Details by ID or Slug
router.get('/:id', productController.getById);

// 6. Protected Admin Routes
router.post('/', requireAuth, requirePermission('manage_products'), productController.create);
router.patch('/:id', requireAuth, requirePermission('manage_products'), productController.update);
router.delete('/:id', requireAuth, requirePermission('manage_products'), productController.delete);

export const productRoutes = router;

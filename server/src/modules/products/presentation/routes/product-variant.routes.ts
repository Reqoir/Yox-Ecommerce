/**
 * @file product-variant.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { ProductVariantController } from '../controllers/product-variant.controller';
import { ProductVariantRepository } from '../../infrastructure/repositories/product-variant.repository';
import { ProductRepository } from '../../infrastructure/repositories/product.repository';
import { 
  CreateProductVariantUseCase, 
  UpdateProductVariantUseCase, 
  DeleteProductVariantUseCase, 
  GetProductVariantByIdUseCase, 
  GetAllProductVariantsUseCase 
} from '../../application/use-cases/product-variant.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

const variantRepo = new ProductVariantRepository();
const productRepo = new ProductRepository();

const variantController = new ProductVariantController(
  new CreateProductVariantUseCase(variantRepo, productRepo),
  new UpdateProductVariantUseCase(variantRepo),
  new DeleteProductVariantUseCase(variantRepo),
  new GetProductVariantByIdUseCase(variantRepo),
  new GetAllProductVariantsUseCase(variantRepo)
);

router.get('/', variantController.getAll); 
router.get('/:id', variantController.getById);

// Protected Admin Routes
router.post('/', requireAuth, requirePermission('manage_products'), variantController.create);
router.patch('/:id', requireAuth, requirePermission('manage_products'), variantController.update);
router.delete('/:id', requireAuth, requirePermission('manage_products'), variantController.delete);

export const productVariantRoutes = router;

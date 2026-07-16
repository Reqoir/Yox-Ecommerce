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
router.post('/', variantController.create);
router.patch('/:id', variantController.update);
router.delete('/:id', variantController.delete);

export const productVariantRoutes = router;

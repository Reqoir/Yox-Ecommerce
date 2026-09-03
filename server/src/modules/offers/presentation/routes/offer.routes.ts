/**
 * @file offer.routes.ts
 * @layer Presentation › Routes
 * 
 * Express routes for the Offers module.
 */

import { Router } from 'express';
import { OfferController } from '../controllers/offer.controller';
import { OfferRepository } from '../../infrastructure/repositories/offer.repository';
import { ProductRepository } from '../../../products/infrastructure/repositories/product.repository';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import {
  CreateOfferUseCase,
  UpdateOfferUseCase,
  DeleteOfferUseCase,
  GetOfferByIdUseCase,
  GetAllOffersUseCase,
  GetActiveOffersUseCase,
  GetActiveBannersUseCase,
  GetBestOfferForProductUseCase,
  GetOfferWithProductsUseCase,
} from '../../application/use-cases/offer.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const router = Router();

const offerRepo = new OfferRepository();
const productRepo = new ProductRepository();
const variantRepo = new ProductVariantRepository();

const offerController = new OfferController(
  new CreateOfferUseCase(offerRepo),
  new UpdateOfferUseCase(offerRepo),
  new DeleteOfferUseCase(offerRepo),
  new GetOfferByIdUseCase(offerRepo),
  new GetAllOffersUseCase(offerRepo),
  new GetActiveOffersUseCase(offerRepo),
  new GetActiveBannersUseCase(offerRepo),
  new GetBestOfferForProductUseCase(offerRepo, productRepo, variantRepo),
  new GetOfferWithProductsUseCase(offerRepo, variantRepo)
);

// --- Public Endpoints ---
router.get('/active', offerController.getActive);
router.get('/banners', offerController.getBanners);
router.get('/product/:productId', offerController.getBestOfferForProduct);
router.get('/:id/products', offerController.getWithProducts);
router.get('/:id', offerController.getById);
router.get('/', offerController.getAll);

// --- Protected Admin Endpoints ---
router.post('/', requireAuth, offerController.create);
router.patch('/:id', requireAuth, offerController.update);
router.patch('/:id/toggle-status', requireAuth, offerController.toggleStatus);
router.delete('/:id', requireAuth, offerController.delete);

export const offerRoutes = router;

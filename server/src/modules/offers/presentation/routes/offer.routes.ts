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
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { cacheMiddleware, invalidateCache } from '../../../../presentation/http/middleware/cache.middleware';

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

// --- Public Endpoints (Cached in Redis for 5 minutes) ---
router.get('/active', cacheMiddleware(300, 'offers'), offerController.getActive);
router.get('/banners', cacheMiddleware(300, 'offers'), offerController.getBanners);
router.get('/product/:productId', cacheMiddleware(300, 'offers'), offerController.getBestOfferForProduct);
router.get('/:id/products', cacheMiddleware(300, 'offers'), offerController.getWithProducts);
router.get('/:id', cacheMiddleware(300, 'offers'), offerController.getById);
router.get('/', cacheMiddleware(300, 'offers'), offerController.getAll);

// --- Protected Admin Endpoints (Invalidates offers cache upon mutation) ---
router.post('/', requireAuth, requirePermission('manage_offers'), async (req, res, next) => {
  await invalidateCache('offers:*');
  return offerController.create(req, res, next);
});
router.patch('/:id', requireAuth, requirePermission('manage_offers'), async (req, res, next) => {
  await invalidateCache('offers:*');
  return offerController.update(req, res, next);
});
router.patch('/:id/toggle-status', requireAuth, requirePermission('manage_offers'), async (req, res, next) => {
  await invalidateCache('offers:*');
  return offerController.toggleStatus(req, res, next);
});
router.delete('/:id', requireAuth, requirePermission('manage_offers'), async (req, res, next) => {
  await invalidateCache('offers:*');
  return offerController.delete(req, res, next);
});

export const offerRoutes = router;

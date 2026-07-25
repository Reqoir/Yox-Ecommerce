/**
 * @file checkout.routes.ts
 * @layer Presentation
 * 
 * Express routes for the Checkout module.
 */

import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { GetCheckoutSummaryUseCase } from '../../application/use-cases/get-checkout-summary.use-case';
import { CartRepository } from '../../../cart/infrastructure/repositories/cart.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

export const checkoutRouter = Router();

// --- Dependency Injection ---
const cartRepository = new CartRepository();
const getCheckoutSummaryUseCase = new GetCheckoutSummaryUseCase(cartRepository);
const checkoutController = new CheckoutController(getCheckoutSummaryUseCase);

// --- Routes ---
// All checkout routes require authentication
checkoutRouter.use(requireAuth);

checkoutRouter.get('/summary', checkoutController.getSummary);

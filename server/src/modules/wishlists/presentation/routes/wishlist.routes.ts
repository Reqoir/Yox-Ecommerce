/**
 * @file wishlist.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { WishlistRepository } from '../../infrastructure/repositories/wishlist.repository';
import { ToggleWishlistUseCase } from '../../application/use-cases/toggle-wishlist.use-case';
import { GetWishlistUseCase } from '../../application/use-cases/get-wishlist.use-case';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const wishlistRepo = new WishlistRepository();
const toggleWishlistUseCase = new ToggleWishlistUseCase(wishlistRepo);
const getWishlistUseCase = new GetWishlistUseCase(wishlistRepo);
const wishlistController = new WishlistController(toggleWishlistUseCase, getWishlistUseCase);

export const wishlistRoutes = Router();

// Protected routes
wishlistRoutes.use(requireAuth);
wishlistRoutes.get('/', wishlistController.getWishlist);
wishlistRoutes.post('/toggle', wishlistController.toggleWishlist);

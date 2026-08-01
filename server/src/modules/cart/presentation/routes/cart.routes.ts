/**
 * @file cart.routes.ts
 * @layer Presentation
 * 
 * Express routes for the Cart module.
 */

import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { CartRepository } from '../../infrastructure/repositories/cart.repository';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import { ProductRepository } from '../../../products/infrastructure/repositories/product.repository';
import { 
  GetCartUseCase, 
  AddItemToCartUseCase, 
  UpdateCartItemUseCase, 
  RemoveCartItemUseCase, 
  ClearCartUseCase 
} from '../../application/use-cases/cart.use-cases';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

export const cartRouter = Router();

// --- Dependency Injection ---
const cartRepository = new CartRepository();
const variantRepository = new ProductVariantRepository();
const productRepository = new ProductRepository();

const getCartUseCase = new GetCartUseCase(cartRepository, variantRepository, productRepository);
const addItemToCartUseCase = new AddItemToCartUseCase(cartRepository, variantRepository, productRepository);
const updateCartItemUseCase = new UpdateCartItemUseCase(cartRepository, variantRepository, productRepository);
const removeCartItemUseCase = new RemoveCartItemUseCase(cartRepository, variantRepository, productRepository);
const clearCartUseCase = new ClearCartUseCase(cartRepository, variantRepository, productRepository);

const cartController = new CartController(
  getCartUseCase,
  addItemToCartUseCase,
  updateCartItemUseCase,
  removeCartItemUseCase,
  clearCartUseCase
);

// --- Routes ---
// All cart routes require authentication
cartRouter.use(requireAuth);

cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', cartController.addItem);
cartRouter.patch('/items/:variantId', cartController.updateItem);
cartRouter.delete('/items/:variantId', cartController.removeItem);
cartRouter.delete('/', cartController.clearCart);

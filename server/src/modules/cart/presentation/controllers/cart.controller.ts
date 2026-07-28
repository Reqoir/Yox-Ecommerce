/**
 * @file cart.controller.ts
 * @layer Presentation
 * 
 * Express controller for Cart endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../../../shared/constants/http-status.constants';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { 
  GetCartUseCase, 
  AddItemToCartUseCase, 
  UpdateCartItemUseCase, 
  RemoveCartItemUseCase, 
  ClearCartUseCase 
} from '../../application/use-cases/cart.use-cases';
import { AddCartItemSchema, UpdateCartItemSchema } from '../../application/dtos/cart.dto';

export class CartController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase
  ) {}

  /**
   * GET /api/v1/cart
   */
  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id; // Assumes authMiddleware sets req.user
      const cart = await this.getCartUseCase.execute(userId);
      ApiResponse.success(res, cart, 'Cart retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/cart/items
   */
  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = AddCartItemSchema.parse(req.body);
      const cart = await this.addItemToCartUseCase.execute({ userId, data });
      ApiResponse.success(res, cart, 'Item added to cart', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/cart/items/:variantId
   */
  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { variantId } = req.params;
      const data = UpdateCartItemSchema.parse(req.body);
      
      const cart = await this.updateCartItemUseCase.execute({ userId, variantId, data });
      ApiResponse.success(res, cart, 'Cart item updated');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/cart/items/:variantId
   */
  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { variantId } = req.params;
      
      const cart = await this.removeCartItemUseCase.execute({ userId, variantId });
      ApiResponse.success(res, cart, 'Cart item removed');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/cart
   */
  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const cart = await this.clearCartUseCase.execute(userId);
      ApiResponse.success(res, cart, 'Cart cleared successfully');
    } catch (error) {
      next(error);
    }
  };
}

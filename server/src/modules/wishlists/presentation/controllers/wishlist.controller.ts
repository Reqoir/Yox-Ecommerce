/**
 * @file wishlist.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response } from 'express';
import { ToggleWishlistUseCase } from '../../application/use-cases/toggle-wishlist.use-case';
import { GetWishlistUseCase } from '../../application/use-cases/get-wishlist.use-case';
import { ClearWishlistUseCase } from '../../application/use-cases/clear-wishlist.use-case';

export class WishlistController {
  constructor(
    private readonly toggleWishlistUseCase: ToggleWishlistUseCase,
    private readonly getWishlistUseCase: GetWishlistUseCase,
    private readonly clearWishlistUseCase: ClearWishlistUseCase
  ) {}

  toggleWishlist = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { productId, color } = req.body;
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
      }

      const result = await this.toggleWishlistUseCase.execute(userId, productId, color);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getWishlist = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await this.getWishlistUseCase.execute(userId);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  clearWishlist = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await this.clearWishlistUseCase.execute(userId);
      return res.status(200).json({ success: true, data: result, message: 'Wishlist cleared successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

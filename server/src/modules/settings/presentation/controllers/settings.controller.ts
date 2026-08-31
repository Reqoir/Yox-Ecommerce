import { Request, Response } from 'express';
import { SettingsModel } from '../../infrastructure/models/settings.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

export class SettingsController {
  public async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const setting = await SettingsModel.findOne({ key });
      
      if (!setting) {
        res.status(200).json({ success: true, data: null });
        return;
      }
      
      // Handle special population logic for storefront offers
      if (key === 'storefront.exclusive_offers' && setting.value?.productIds) {
        const products = await ProductModel.find({ 
          _id: { $in: setting.value.productIds },
          isActive: true 
        }).populate('category').lean();

        const populatedValue = {
          ...setting.value,
          products: products.map((p: any) => ({
            id: p._id.toString(),
            category: p.category?.name || 'Category',
            price: p.variants?.[0]?.price?.toFixed(2) || '0.00',
            oldPrice: p.variants?.[0]?.compareAtPrice?.toFixed(2) || null,
            title: p.name,
            image: p.thumbnail || '/images/placeholder.webp',
            slug: p.slug
          }))
        };
        
        res.status(200).json({ success: true, data: populatedValue });
        return;
      }
      
      res.status(200).json({ success: true, data: setting.value });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const setting = await SettingsModel.findOneAndUpdate(
        { key },
        { value },
        { new: true, upsert: true }
      );
      
      res.status(200).json({ success: true, data: setting.value });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

import { Request, Response } from 'express';
import { SettingsModel } from '../../infrastructure/models/settings.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';

export const DEFAULT_STORE_CONFIG = {
  storeName: "YOX Men's Fashion",
  tagline: "Elevate Your Style with Premium Contemporary Apparel",
  supportEmail: "support@yox.com",
  supportPhone: "+91 98765 43210",
  storeAddress: "YOX Fashion House, BKC, Bandra East, Mumbai, Maharashtra 400051",
  currency: "INR",
  currencySymbol: "₹",

  // Shipping & Delivery
  freeShippingThreshold: 699,
  standardShippingFee: 99,
  estimatedDeliveryDaysMin: 3,
  estimatedDeliveryDaysMax: 5,
  deliveryPartner: "Delhivery / BlueDart Express",

  // Payment & COD
  codEnabled: true,
  codMaxLimit: 5000,
  taxRatePercent: 18,
  isTaxInclusive: true,

  // Returns & Refunds
  returnsEnabled: true,
  returnWindowDays: 7,
  minEvidencePhotos: 3,
  returnPolicyNotice: "Hassle-free 7-day returns on unworn items with original tags.",

  // Announcement & Store Alerts
  announcementEnabled: true,
  announcementText: "⚡ Festive Season Exclusive: Get Extra 10% Off with Code YOX10 | Free Shipping On Orders Above ₹699",
  announcementLink: "/shop",
  announcementBgColor: "bg-black",

  // Maintenance Mode
  maintenanceMode: false,
  maintenanceNotice: "Store maintenance in progress. We will be back online shortly."
};

export class SettingsController {
  public async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const setting = await SettingsModel.findOne({ key });
      
      if (!setting) {
        if (key === 'store_config') {
          res.status(200).json({ success: true, data: DEFAULT_STORE_CONFIG });
          return;
        }
        res.status(200).json({ success: true, data: null });
        return;
      }

      if (key === 'store_config') {
        const merged = { ...DEFAULT_STORE_CONFIG, ...(setting.value || {}) };
        res.status(200).json({ success: true, data: merged });
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
      
      let finalValue = value;
      if (key === 'store_config') {
        const existing = await SettingsModel.findOne({ key });
        finalValue = {
          ...DEFAULT_STORE_CONFIG,
          ...(existing?.value || {}),
          ...value,
        };
      }

      const setting = await SettingsModel.findOneAndUpdate(
        { key },
        { value: finalValue },
        { new: true, upsert: true }
      );
      
      res.status(200).json({ success: true, data: setting.value });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

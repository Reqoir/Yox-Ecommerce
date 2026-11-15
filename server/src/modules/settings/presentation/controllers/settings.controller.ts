import { Request, Response } from 'express';
import { SettingsModel } from '../../infrastructure/models/settings.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';
import { updateSettingBodySchema, storeConfigSchema } from '../validators/settings.validator';

const roleRepository = new RoleRepository();

const PUBLIC_SETTINGS_KEYS = new Set([
  'store_config',
  'storefront.exclusive_offers',
  'storefront.hero_banners',
]);

const checkHasManageSettings = async (user: any): Promise<boolean> => {
  if (!user || !user.role) return false;
  const userRoleStr = String(user.role).toLowerCase();
  if (userRoleStr === 'admin' || userRoleStr === 'super_admin') return true;
  try {
    const role = await roleRepository.findById(user.role);
    if (
      role &&
      (role.name.toUpperCase() === 'ADMIN' ||
        role.name.toUpperCase() === 'SUPER_ADMIN' ||
        role.hasPermission('*') ||
        role.hasPermission('manage_settings'))
    ) {
      return true;
    }
  } catch {}
  return false;
};

export const DEFAULT_STORE_CONFIG = {
  storeName: "YOX Men's Fashion",
  tagline: "Elevate Your Style with Premium Contemporary Apparel",
  supportEmail: "support@yox.com",
  supportPhone: "+91 98765 43210",
  storeAddress: "YOX Fashion House, BKC, Bandra East, Mumbai, Maharashtra 400051",
  currency: "INR",
  currencySymbol: "₹",

  // Shipping & Delivery (100% Free Shipping nationwide on all orders)
  freeShippingThreshold: 0,
  standardShippingFee: 0,
  estimatedDeliveryDaysMin: 2,
  estimatedDeliveryDaysMax: 4,
  deliveryPartner: "Priority Express Logistics",

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
  announcementText: "⚡ Festive Season Exclusive: Get Extra 10% Off with Code YOX10 | 100% Free Shipping On All Orders Nationwide",
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

      // Access control: Non-public setting keys strictly require manage_settings permission
      if (!PUBLIC_SETTINGS_KEYS.has(key)) {
        const isAuthorized = await checkHasManageSettings(req.user);
        if (!isAuthorized) {
          res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to view internal configuration settings.',
          });
          return;
        }
      }

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

      const bodyParse = updateSettingBodySchema.safeParse(req.body);
      if (!bodyParse.success) {
        res.status(400).json({
          success: false,
          message: bodyParse.error.errors[0]?.message || 'Invalid request body format',
        });
        return;
      }

      const { value } = bodyParse.data;
      
      let finalValue = value;
      if (key === 'store_config') {
        const configParse = storeConfigSchema.safeParse(value);
        if (!configParse.success) {
          res.status(400).json({
            success: false,
            message: 'Invalid store configuration parameters',
            errors: configParse.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
          return;
        }

        const existing = await SettingsModel.findOne({ key });
        finalValue = {
          ...DEFAULT_STORE_CONFIG,
          ...(existing?.value || {}),
          ...configParse.data,
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

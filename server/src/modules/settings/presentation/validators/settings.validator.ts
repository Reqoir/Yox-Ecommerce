/**
 * @file settings.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const storeConfigSchema = z.object({
  storeName: z.string().min(1, 'Store name cannot be empty').max(100).optional(),
  tagline: z.string().max(200).optional(),
  supportEmail: z.string().email('Invalid support email address').optional(),
  supportPhone: z.string().max(30).optional(),
  storeAddress: z.string().max(300).optional(),
  currency: z.string().max(10).optional(),
  currencySymbol: z.string().max(10).optional(),

  // Shipping & Delivery
  freeShippingThreshold: z.number().min(0, 'Free shipping threshold must be >= 0').optional(),
  standardShippingFee: z.number().min(0, 'Standard shipping fee must be >= 0').optional(),
  estimatedDeliveryDaysMin: z.number().int().min(0).max(60).optional(),
  estimatedDeliveryDaysMax: z.number().int().min(0).max(60).optional(),
  deliveryPartner: z.string().max(100).optional(),

  // Payment & COD
  codEnabled: z.boolean().optional(),
  codMaxLimit: z.number().min(0, 'COD max limit must be >= 0').max(1000000).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  isTaxInclusive: z.boolean().optional(),

  // Returns & Refunds
  returnsEnabled: z.boolean().optional(),
  returnWindowDays: z.number().int().min(0).max(90).optional(),
  minEvidencePhotos: z.number().int().min(0).max(10).optional(),
  returnPolicyNotice: z.string().max(500).optional(),

  // Announcement & Store Alerts
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().max(500).optional(),
  announcementLink: z.string().max(255).optional(),
  announcementBgColor: z.string().max(50).optional(),

  // Maintenance Mode
  maintenanceMode: z.boolean().optional(),
  maintenanceNotice: z.string().max(500).optional(),
}).strict();

export const updateSettingBodySchema = z.object({
  value: z.union([z.record(z.string(), z.any()), z.string(), z.number(), z.boolean(), z.array(z.any())], {
    error: 'Setting value is required',
  }),
});

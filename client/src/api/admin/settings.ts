import apiClient from '@/lib/axios';

export interface StoreConfig {
  // General Store Info & Branding
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  currency: string;
  currencySymbol: string;

  // Shipping & Delivery Rules
  freeShippingThreshold: number;
  standardShippingFee: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  deliveryPartner: string;

  // Payment & COD Policies
  codEnabled: boolean;
  codMaxLimit: number;
  taxRatePercent: number;
  isTaxInclusive: boolean;

  // Returns & Refunds Policy
  returnsEnabled: boolean;
  returnWindowDays: number;
  minEvidencePhotos: number;
  returnPolicyNotice: string;

  // Announcement & Store Alerts
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  announcementBgColor: string;

  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceNotice: string;
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: "YOX Men's Fashion",
  tagline: "Elevate Your Style with Premium Contemporary Apparel",
  supportEmail: "support@yox.com",
  supportPhone: "+91 98765 43210",
  storeAddress: "YOX Fashion House, BKC, Bandra East, Mumbai, Maharashtra 400051",
  currency: "INR",
  currencySymbol: "₹",

  freeShippingThreshold: 699,
  standardShippingFee: 99,
  estimatedDeliveryDaysMin: 3,
  estimatedDeliveryDaysMax: 5,
  deliveryPartner: "Delhivery / BlueDart Express",

  codEnabled: true,
  codMaxLimit: 5000,
  taxRatePercent: 18,
  isTaxInclusive: true,

  returnsEnabled: true,
  returnWindowDays: 7,
  minEvidencePhotos: 3,
  returnPolicyNotice: "Hassle-free 7-day returns on unworn items with original tags.",

  announcementEnabled: true,
  announcementText: "⚡ Festive Season Exclusive: Get Extra 10% Off with Code YOX10 | Free Shipping On Orders Above ₹699",
  announcementLink: "/shop",
  announcementBgColor: "bg-black",

  maintenanceMode: false,
  maintenanceNotice: "Store maintenance in progress. We will be back online shortly."
};

export const settingsApi = {
  getSetting: async <T>(key: string): Promise<T | null> => {
    const response = await apiClient.get<{ success: boolean; data: T }>(`/settings/${key}`);
    return response.data?.data ?? null;
  },
  
  updateSetting: async <T>(key: string, value: T): Promise<T> => {
    const response = await apiClient.put<{ success: boolean; data: T }>(`/settings/${key}`, { value });
    return response.data.data;
  },

  getStoreConfig: async (): Promise<StoreConfig> => {
    const response = await apiClient.get<{ success: boolean; data: StoreConfig }>('/settings/store_config');
    return response.data?.data ?? DEFAULT_STORE_CONFIG;
  },

  updateStoreConfig: async (config: Partial<StoreConfig>): Promise<StoreConfig> => {
    const response = await apiClient.put<{ success: boolean; data: StoreConfig }>('/settings/store_config', { value: config });
    return response.data?.data ?? DEFAULT_STORE_CONFIG;
  }
};

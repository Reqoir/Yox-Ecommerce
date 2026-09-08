import apiClient from '@/lib/axios';
import { uploadApi } from './upload';

export interface HeroBannerSlide {
  id: string;
  badgeText?: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  textAlign?: 'left' | 'center' | 'right';
  theme?: 'dark' | 'light';
  overlayOpacity?: number; // 0 - 100
  isActive: boolean;
  order: number;
  categoryId?: string;
  categorySlug?: string;
  showTextOverlay?: boolean;
}

export interface HeroBannersConfig {
  autoPlay: boolean;
  autoPlayInterval: number; // in seconds
  slides: HeroBannerSlide[];
}

export const DEFAULT_HERO_CONFIG: HeroBannersConfig = {
  autoPlay: true,
  autoPlayInterval: 4,
  slides: [
    {
      id: 'hero-1788781577517',
      badgeText: 'SPECIAL COLLECTION',
      title: 'NEW SEASON ARRIVALS',
      subtitle:
        'Discover refined craftsmanship with modern silhouettes tailored for luxury comfort.',
      buttonText: 'Shop The Drop',
      buttonLink: '/shop?category=shirts',
      secondaryButtonText: 'Learn More',
      secondaryButtonLink: '/shop',
      imageUrl:
        'https://res.cloudinary.com/s9pshncg/image/upload/v1788781611/yox_ecommerce_products/utad2txtrutyh7zbjhie.png',
      mobileImageUrl:
        'https://res.cloudinary.com/s9pshncg/image/upload/v1788798289/yox_ecommerce_products/vjde9b4ebhibycur6b2e.png',
      textAlign: 'left',
      theme: 'dark',
      overlayOpacity: 0,
      isActive: true,
      order: 1,
      categoryId: '6a93cf5adede7faa4aa3a0d4',
      categorySlug: 'shirts',
      showTextOverlay: false,
    },
    {
      id: 'hero-1788782517503',
      badgeText: 'SPECIAL COLLECTION',
      title: 'NEW SEASON ARRIVALS',
      subtitle:
        'Discover refined craftsmanship with modern silhouettes tailored for luxury comfort.',
      buttonText: 'Shop The Drop',
      buttonLink: '/shop?category=linen',
      secondaryButtonText: 'Learn More',
      secondaryButtonLink: '/shop',
      imageUrl:
        'https://res.cloudinary.com/s9pshncg/image/upload/v1788782532/yox_ecommerce_products/shbuz2uzgkrlhbn63iyr.png',
      mobileImageUrl:
        'https://res.cloudinary.com/s9pshncg/image/upload/v1788798352/yox_ecommerce_products/i2b0tu8rfpgxqm2yhw4g.png',
      textAlign: 'left',
      theme: 'dark',
      overlayOpacity: 45,
      isActive: true,
      order: 2,
      categoryId: '6a97e3852687f0021b4eeb0b',
      categorySlug: 'linen',
    },
  ],
};

export const contentApi = {
  getHeroBanners: async (): Promise<HeroBannersConfig> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: HeroBannersConfig | null }>(
        '/settings/storefront.hero_banners',
      );
      if (
        response.data?.data &&
        Array.isArray(response.data.data.slides) &&
        response.data.data.slides.length > 0
      ) {
        return response.data.data;
      }
      return DEFAULT_HERO_CONFIG;
    } catch (error) {
      console.warn('Failed to load hero banners, falling back to default:', error);
      return DEFAULT_HERO_CONFIG;
    }
  },

  updateHeroBanners: async (config: HeroBannersConfig): Promise<HeroBannersConfig> => {
    const response = await apiClient.put<{ success: boolean; data: HeroBannersConfig }>(
      '/settings/storefront.hero_banners',
      { value: config },
    );
    return response.data.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    return await uploadApi.uploadImage(file);
  },
};

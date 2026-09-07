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
  autoPlayInterval: 6,
  slides: [
    {
      id: 'default-hero-1',
      badgeText: 'NEW ARRIVALS',
      title: 'THE ART OF EFFORTLESS LUXURY',
      subtitle:
        'Explore our latest collection of meticulously crafted menswear designed for timeless modern sophistication.',
      buttonText: 'Shop New Arrivals',
      buttonLink: '/shop',
      secondaryButtonText: 'Explore Offers',
      secondaryButtonLink: '/offers',
      imageUrl: '/images/hero-banner.png',
      textAlign: 'left',
      theme: 'dark',
      overlayOpacity: 45,
      isActive: true,
      order: 1,
    },
    {
      id: 'default-hero-2',
      badgeText: 'SUMMER ESSENTIALS',
      title: 'BREATHE EASY IN PURE LINEN',
      subtitle:
        'Lightweight, breathable textures tailored for unmatched comfort and sharp aesthetics.',
      buttonText: 'Discover Linen',
      buttonLink: '/shop?category=linen',
      secondaryButtonText: 'View Collection',
      secondaryButtonLink: '/shop',
      imageUrl: '/images/linen-banner.png',
      textAlign: 'left',
      theme: 'dark',
      overlayOpacity: 40,
      isActive: true,
      order: 2,
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

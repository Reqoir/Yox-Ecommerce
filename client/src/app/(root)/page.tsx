import ReactDOM from 'react-dom';
import { HeroBanner } from '@/components/features/home/hero-banner';
import { FeaturedSection } from '@/components/features/home/featured-section';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { ExclusiveOffers } from '@/components/features/home/exclusive-offers';
import { NewAndPopular } from '@/components/features/home/new-and-popular';
import { FashionQuote } from '@/components/features/home/fashion-quote';
import { optimizeCloudinaryUrl } from '@/lib/utils';
import { DEFAULT_HERO_CONFIG, type HeroBannersConfig } from '@/api/admin/content';

async function getInitialHeroConfig(): Promise<HeroBannersConfig> {
  const apiBase = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5001/api/v1'
  ).replace(/\/$/, '');

  try {
    const res = await fetch(`${apiBase}/settings/storefront.hero_banners`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) return DEFAULT_HERO_CONFIG;

    const json = await res.json();
    const data = json?.data;
    if (data && Array.isArray(data.slides) && data.slides.length > 0) {
      return data as HeroBannersConfig;
    }
  } catch {
    // Fall back gracefully if backend is unreachable
  }

  return DEFAULT_HERO_CONFIG;
}

export default async function Home() {
  const initialHeroConfig = await getInitialHeroConfig();
  const activeSlides = initialHeroConfig.slides.filter((s) => s.isActive);
  const firstSlide = activeSlides[0] || initialHeroConfig.slides[0] || DEFAULT_HERO_CONFIG.slides[0];

  // Preload LCP hero image candidate to start network download during HTML streaming
  if (firstSlide) {
    if (firstSlide.imageUrl) {
      ReactDOM.preload(optimizeCloudinaryUrl(firstSlide.imageUrl, 1920), {
        as: 'image',
        fetchPriority: 'high',
      });
    }
    if (firstSlide.mobileImageUrl) {
      ReactDOM.preload(optimizeCloudinaryUrl(firstSlide.mobileImageUrl, 900), {
        as: 'image',
        fetchPriority: 'high',
      });
    }
  }

  return (
    <main className="w-full flex flex-col bg-white min-h-screen">
      <HeroBanner initialConfig={initialHeroConfig} />
      <FeaturedSection />
      <StyleSeekers />
      <ExclusiveOffers />
      <NewAndPopular />
      <FashionQuote />
    </main>
  );
}

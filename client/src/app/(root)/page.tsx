import ReactDOM from 'react-dom';
import { HeroBanner } from '@/components/features/home/hero-banner';
import { FeaturedSection } from '@/components/features/home/featured-section';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { ExclusiveOffers } from '@/components/features/home/exclusive-offers';
import { NewAndPopular } from '@/components/features/home/new-and-popular';
import { FashionQuote } from '@/components/features/home/fashion-quote';
import { optimizeCloudinaryUrl } from '@/lib/utils';
import { DEFAULT_HERO_CONFIG } from '@/api/admin/content';

export default function Home() {
  // Preload LCP hero image candidate to start network download during HTML streaming
  const firstSlide = DEFAULT_HERO_CONFIG.slides[0];
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
      <HeroBanner />
      <FeaturedSection />
      <StyleSeekers />
      <ExclusiveOffers />
      <NewAndPopular />
      <FashionQuote />
    </main>
  );
}

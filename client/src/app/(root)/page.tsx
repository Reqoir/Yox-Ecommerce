import { HeroBanner } from '@/components/features/home/hero-banner';
import { FeaturedSection } from '@/components/features/home/featured-section';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { ExclusiveOffers } from '@/components/features/home/exclusive-offers';
import { NewAndPopular } from '@/components/features/home/new-and-popular';
import { FashionQuote } from '@/components/features/home/fashion-quote';

export default function Home() {
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

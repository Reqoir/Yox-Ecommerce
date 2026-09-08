import { HeroBanner } from '@/components/features/home/hero-banner';
import { NewAndPopular } from '@/components/features/home/new-and-popular';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { OfferBannerSlider } from '@/components/features/home/offer-banner-slider';
import { FeaturedSection } from '@/components/features/home/featured-section';
import { ExclusiveOffers } from '@/components/features/home/exclusive-offers';
import { FashionQuote } from '@/components/features/home/fashion-quote';

export default function Home() {
  return (
    <main className="w-full flex flex-col bg-white min-h-screen">
      <HeroBanner />
      <NewAndPopular />
      <StyleSeekers />
      <OfferBannerSlider />
      <FeaturedSection />
      <ExclusiveOffers />
      <FashionQuote />
    </main>
  );
}

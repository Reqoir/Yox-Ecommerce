import { HeroBanner } from '@/components/features/home/hero-banner';
import { OfferBannerSlider } from '@/components/features/home/offer-banner-slider';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { FeaturedSection } from '@/components/features/home/featured-section';
import { ExclusiveOffers } from '@/components/features/home/exclusive-offers';
import { NewAndPopular } from '@/components/features/home/new-and-popular';

export default function Home() {
  return (
    <main className="w-full flex flex-col bg-white min-h-screen pb-16">
      <HeroBanner />
      <OfferBannerSlider />
      <StyleSeekers />
      <FeaturedSection />
      <ExclusiveOffers />
      <NewAndPopular />
    </main>
  );
}

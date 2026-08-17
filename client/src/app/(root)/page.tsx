import { HeroBanner } from '@/components/features/home/hero-banner';
import { StyleSeekers } from '@/components/features/home/style-seekers';
import { FeaturedSection } from '@/components/features/home/featured-section';

export default function Home() {
  return (
    <main className="w-full flex flex-col bg-white min-h-screen pb-16">
      <HeroBanner />
      <StyleSeekers />
      <FeaturedSection />
    </main>
  );
}

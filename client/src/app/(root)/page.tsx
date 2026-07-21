import { CategoryStrip } from '@/components/features/home/category-strip';
import { HeroBanner } from '@/components/features/home/hero-banner';
import { NewArrivals } from '@/components/features/home/new-arrivals';
import { PromoBanner } from '@/components/features/home/promo-banner';

export default function Home() {
  return (
    <main className="w-full flex flex-col bg-white min-h-screen pb-16">
      <CategoryStrip />
      <HeroBanner />
      <NewArrivals />
      <PromoBanner />
    </main>
  );
}

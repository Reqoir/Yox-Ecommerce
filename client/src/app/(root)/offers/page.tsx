'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { offersApi, Offer } from '@/api/admin/offers';
import { Loader2 } from 'lucide-react';

export default function OffersPage() {
  const router = useRouter();
  const { data: activeOffers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['active-offers'],
    queryFn: offersApi.getActive,
  });

  useEffect(() => {
    if (!isLoading) {
      if (activeOffers && activeOffers.length > 0) {
        // Redirect to top active offer
        const sorted = [...activeOffers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        router.replace(`/offers/${sorted[0].id}`);
      } else {
        // Fallback to shop page
        router.replace('/shop');
      }
    }
  }, [activeOffers, isLoading, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Redirecting to latest offers...</p>
    </div>
  );
}

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonProductCard } from '@/components/features/shop/skeleton-product-card';

export function ShopSkeleton() {
  return (
    <main className="w-full bg-white min-h-screen pb-16 lg:pb-16 relative animate-in fade-in duration-500">
      <div className="w-[98%] max-w-[1500px] mx-auto flex items-start pt-0 lg:pt-8 gap-8">
        {/* Sidebar Skeleton (Desktop Only) */}
        <div className="w-56 hidden lg:flex flex-col gap-8 flex-shrink-0">
          <div className="flex flex-col gap-4">
            <Skeleton className="w-24 h-5 rounded-none" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-3/4 h-4 rounded-none" />
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <Skeleton className="w-24 h-5 rounded-none" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-10 h-10 rounded-none" />
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid Area Skeleton */}
        <div className="w-full flex-1">
          {/* Top Meta Area */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <Skeleton className="w-48 h-8 rounded-none" />
            <Skeleton className="w-48 h-10 rounded-none" />
          </div>
          
          {/* Tabs */}
          <div className="hidden lg:flex flex-wrap gap-2 mb-8">
             {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-8 rounded-none" />
             ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-2.5 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-8 lg:gap-y-10 px-0.5 sm:px-1 lg:px-0">
            {Array.from({ length: 15 }).map((_, idx) => (
              <SkeletonProductCard key={idx} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonProductCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full aspect-[1/1.42] sm:aspect-[3/4] rounded-none" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-3/4 rounded-none" />
        <Skeleton className="h-3 w-1/4 rounded-none" />
      </div>
    </div>
  );
}

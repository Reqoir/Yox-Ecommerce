"use client";

import React from 'react';
import { Loader2, ArrowUp, Check } from 'lucide-react';

export interface InfiniteScrollStatusProps {
  currentCount: number;
  totalCount: number;
  isLoadingMore: boolean;
  itemLabel?: string;
  className?: string;
  showProgressBar?: boolean;
  showBackToTop?: boolean;
}

export function InfiniteScrollStatus({
  currentCount,
  totalCount,
  isLoadingMore,
  itemLabel = 'products',
  className = '',
  showBackToTop = true,
}: InfiniteScrollStatusProps) {
  if (totalCount === 0) return null;

  const isComplete = currentCount >= totalCount;

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If not loading and no back-to-top button needs to be shown, render nothing
  if (!isLoadingMore && (!showBackToTop || currentCount < 8)) {
    return null;
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center py-6 sm:py-8 ${className}`}>
      {/* Loading More State */}
      {isLoadingMore && (
        <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium py-2.5 px-4 bg-gray-50/80 border border-gray-100 shadow-2xs animate-in fade-in duration-200">
          <Loader2 size={15} className="animate-spin text-black" />
          <span className="tracking-wide uppercase text-[11px]">Loading next {itemLabel}...</span>
        </div>
      )}

      {/* Back to Top Button */}
      {!isLoadingMore && isComplete && showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-black border border-gray-200 hover:border-black px-4 py-2 bg-white transition-all cursor-pointer shadow-2xs"
        >
          <ArrowUp size={12} />
          <span>Back to Top</span>
        </button>
      )}
    </div>
  );
}
